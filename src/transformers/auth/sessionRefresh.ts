import type { SessionRefreshPayload, SessionRefreshPayloadApi } from '@/types/auth';
import { keysToSnakeCase } from '@/utils/case';
import { authSessionFromApi } from './sessionResponse';

export const sessionRefreshTransformer = {
  toApi(payload: SessionRefreshPayload): SessionRefreshPayloadApi {
    return keysToSnakeCase<SessionRefreshPayloadApi>(payload);
  },

  fromApi: authSessionFromApi,
};
