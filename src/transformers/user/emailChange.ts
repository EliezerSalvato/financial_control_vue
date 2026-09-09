import type { EmailChangePayload, EmailChangePayloadApi } from '@/types/user';
import { keysToSnakeCase } from '@/utils/case';

export const emailChangeTransformer = {
  toApi(payload: EmailChangePayload): EmailChangePayloadApi {
    return keysToSnakeCase<EmailChangePayloadApi>(payload);
  },
};
