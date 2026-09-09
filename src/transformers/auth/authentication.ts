import type { AuthenticationPayload, AuthenticationPayloadApi, AuthenticationSuccessResponse, AuthenticationSuccessResponseApi } from '@/types/auth';
import { keysToSnakeCase } from '@/utils/case';
import { userFromResource } from '@/transformers/user';

export const authenticationTransformer = {
  toApi(payload: AuthenticationPayload): AuthenticationPayloadApi {
    return keysToSnakeCase<AuthenticationPayloadApi>(payload);
  },

  fromApi(response: AuthenticationSuccessResponseApi): AuthenticationSuccessResponse {
    return {
      status: response.status,
      type: response.type,
      data: {
        token: response.data.token,
        user: userFromResource(response.data.user),
      },
    };
  },
};
