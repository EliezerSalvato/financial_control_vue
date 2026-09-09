import type { User, UserResource } from '@/types/user/user';

export type SessionRefreshPayload = {
  rememberMe: boolean;
};

export type SessionRefreshPayloadApi = {
  remember_me: boolean;
};

export type SessionRefreshSuccessResponseApi = {
  status: 'success';
  type: 'object';
  data: {
    token: string;
    user: UserResource;
  };
};

export type SessionRefreshSuccessResponse = {
  status: 'success';
  type: 'object';
  data: {
    token: string;
    user: User;
  };
};
