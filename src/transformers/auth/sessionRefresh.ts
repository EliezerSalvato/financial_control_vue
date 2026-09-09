import type { SessionRefreshPayload, SessionRefreshPayloadApi, SessionRefreshSuccessResponse, SessionRefreshSuccessResponseApi } from '@/types/auth';
import { keysToSnakeCase } from '@/utils/case';
import { userFromResource } from '@/transformers/user';

export const sessionRefreshTransformer = {
  toApi(payload: SessionRefreshPayload): SessionRefreshPayloadApi {
    return keysToSnakeCase<SessionRefreshPayloadApi>(payload);
  },

  fromApi(response: SessionRefreshSuccessResponseApi): SessionRefreshSuccessResponse {
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
