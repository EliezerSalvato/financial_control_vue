import { subscribeInboxNotifications } from '@/api/notifications';
import { useAuthStore } from '@/stores/auth';
import { useInboxNotificationsStore } from '@/stores/inboxNotifications';
import { onUnmounted, watch } from 'vue';

export function useInboxNotificationsChannel() {
  const authStore = useAuthStore();
  const inboxStore = useInboxNotificationsStore();
  let unsubscribe: (() => void) | null = null;

  function disconnect() {
    unsubscribe?.();
    unsubscribe = null;
  }

  watch(
    () => authStore.isAuthenticated,
    (authenticated) => {
      disconnect();

      if (!authenticated) {
        inboxStore.reset();
        return;
      }

      unsubscribe = subscribeInboxNotifications((broadcast) => {
        inboxStore.applyBroadcast(broadcast);
      });

      void inboxStore.loadPreview().catch(() => {});
    },
    { immediate: true },
  );

  onUnmounted(disconnect);
}
