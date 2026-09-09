import type { AuthSessionSuccessResponse, AuthSessionSuccessResponseApi } from '@/types/auth';
import { userFromResource } from '@/transformers/user';

export function authSessionFromApi(response: AuthSessionSuccessResponseApi): AuthSessionSuccessResponse {
  return {
    status: response.status,
    type: response.type,
    data: {
      token: response.data.token,
      user: userFromResource(response.data.user),
    },
  };
}
