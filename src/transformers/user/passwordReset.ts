import type { PasswordResetUpdatePayload, PasswordResetUpdatePayloadApi } from '@/types/user';
import { keysToSnakeCase } from '@/utils/case';

export const passwordResetTransformer = {
  toApi(payload: PasswordResetUpdatePayload): PasswordResetUpdatePayloadApi {
    return keysToSnakeCase<PasswordResetUpdatePayloadApi>(payload);
  },
};
