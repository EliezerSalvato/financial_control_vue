import type { AuthenticationPayload, AuthenticationPayloadApi } from '@/types/auth';
import { keysToSnakeCase } from '@/utils/case';
import { authSessionFromApi } from './sessionResponse';

export const authenticationTransformer = {
  toApi(payload: AuthenticationPayload): AuthenticationPayloadApi {
    return keysToSnakeCase<AuthenticationPayloadApi>(payload);
  },

  fromApi: authSessionFromApi,
};
