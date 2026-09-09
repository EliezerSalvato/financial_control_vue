import type { User, UserResource } from '@/types/user/user';

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

export type AuthenticationSuccessResponseApi = {
  status: 'success';
  type: 'object';
  data: {
    token: string;
    user: UserResource;
  };
};

export type AuthenticationSuccessResponse = {
  status: 'success';
  type: 'object';
  data: {
    token: string;
    user: User;
  };
};

export type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};
