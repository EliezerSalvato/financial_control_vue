import { useAuthStore } from '@/stores/auth';

const CABLE_URL = import.meta.env.VITE_CABLE_URL;
const MAX_RECONNECT_MS = 30_000;

type ChannelParams = Record<string, string | number | boolean | null>;

export type SubscribeToChannelOptions = {
  channel: string;
  params?: ChannelParams;
  onMessage: (message: unknown) => void;
  onRejected?: () => void;
};

type ActiveSubscription = {
  identifier: string;
  onMessage: (message: unknown) => void;
  onRejected?: () => void;
};

type CableFrame = {
  type?: string;
  identifier?: string;
  message?: unknown;
  reconnect?: boolean;
};

const subscriptions = new Map<string, ActiveSubscription>();

let socket: WebSocket | null = null;
let welcomed = false;
let intentionalClose = false;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let allowReconnect = true;

function buildCableUrl(token: string): string {
  const url = new URL(CABLE_URL);

  // Browsers cannot set Authorization on the WebSocket handshake.
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  }

  url.searchParams.set('token', token);

  return url.toString();
}

function identifierFor(channel: string, params: ChannelParams = {}): string {
  return JSON.stringify({ channel, ...params });
}

function isOpen(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}

function isConnecting(): boolean {
  return socket?.readyState === WebSocket.CONNECTING;
}

function send(payload: Record<string, string>): void {
  if (!isOpen()) return;

  socket?.send(JSON.stringify(payload));
}

function sendSubscribe(identifier: string): void {
  send({ command: 'subscribe', identifier });
}

function sendUnsubscribe(identifier: string): void {
  send({ command: 'unsubscribe', identifier });
}

function subscribeAll(): void {
  for (const identifier of subscriptions.keys()) {
    sendSubscribe(identifier);
  }
}

function clearReconnectTimer(): void {
  if (!reconnectTimer) return;

  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function disconnectSocket(): void {
  intentionalClose = true;
  welcomed = false;
  clearReconnectTimer();
  socket?.close();
  socket = null;
}

function handleFrame(frame: CableFrame): void {
  if (frame.type === 'welcome') {
    welcomed = true;
    reconnectAttempt = 0;
    subscribeAll();
    return;
  }

  if (frame.type === 'ping') return;

  if (frame.type === 'disconnect') {
    allowReconnect = frame.reconnect !== false;
    return;
  }

  if (!frame.identifier) return;

  const subscription = subscriptions.get(frame.identifier);

  if (!subscription) return;

  if (frame.type === 'confirm_subscription') return;

  if (frame.type === 'reject_subscription') {
    subscription.onRejected?.();
    return;
  }

  if (frame.message !== undefined) {
    subscription.onMessage(frame.message);
  }
}

function handleMessage(event: MessageEvent<string>): void {
  try {
    const frame = JSON.parse(event.data) as CableFrame;

    if (!frame || typeof frame !== 'object') return;

    handleFrame(frame);
  } catch {
    return;
  }
}

async function tokenForConnect(refresh: boolean): Promise<string | null> {
  const authStore = useAuthStore();

  if (refresh) {
    try {
      await authStore.refreshToken();
    } catch {
      return authStore.token;
    }
  }

  return authStore.token;
}

function connect(): void {
  if (typeof WebSocket === 'undefined') return;

  if (isOpen() || isConnecting()) return;

  const token = useAuthStore().token;

  if (!token) return;

  intentionalClose = false;
  welcomed = false;
  allowReconnect = true;

  const nextSocket = new WebSocket(buildCableUrl(token));

  socket = nextSocket;
  nextSocket.addEventListener('message', handleMessage);
  nextSocket.addEventListener('close', () => {
    if (socket === nextSocket) {
      socket = null;
    }

    welcomed = false;

    if (intentionalClose || subscriptions.size === 0 || !allowReconnect) return;

    scheduleReconnect();
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  const delay = Math.min(1000 * 2 ** reconnectAttempt, MAX_RECONNECT_MS);

  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void (async () => {
      await tokenForConnect(reconnectAttempt > 1);
      connect();
    })();
  }, delay);
}

function ensureConnected(): void {
  if (isOpen() || isConnecting()) return;

  connect();
}

export function subscribeToChannel(options: SubscribeToChannelOptions): () => void {
  const identifier = identifierFor(options.channel, options.params);
  const subscription: ActiveSubscription = {
    identifier,
    onMessage: options.onMessage,
    onRejected: options.onRejected,
  };

  subscriptions.set(identifier, subscription);
  ensureConnected();

  if (welcomed) {
    sendSubscribe(identifier);
  }

  return () => {
    if (subscriptions.get(identifier) !== subscription) return;

    subscriptions.delete(identifier);
    sendUnsubscribe(identifier);

    if (subscriptions.size === 0) {
      disconnectSocket();
    }
  };
}
