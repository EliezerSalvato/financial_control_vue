export type AuthenticationPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type AuthenticationPayloadApi = {
  email: string;
  password: string;
  remember_me: boolean;
};

export type LoginForm = AuthenticationPayload;
