import type { RegistrationPayload, RegistrationPayloadApi } from '@/types/user';
import { keysToSnakeCase } from '@/utils/case';

export const registrationTransformer = {
  toApi(payload: RegistrationPayload): RegistrationPayloadApi {
    return keysToSnakeCase<RegistrationPayloadApi>(payload);
  },
};
