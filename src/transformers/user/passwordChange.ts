import type { PasswordChangePayload, PasswordChangePayloadApi } from '@/types/user';
import { keysToSnakeCase } from '@/utils/case';

export const passwordChangeTransformer = {
  toApi(payload: PasswordChangePayload): PasswordChangePayloadApi {
    return keysToSnakeCase<PasswordChangePayloadApi>(payload);
  },
};
