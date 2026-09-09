import type { MessageSuccessResponseApi } from '@/types/api';
import type { EmailChangePayload } from '@/types/user';
import { apiRequest } from '@/api/client';
import { emailChangeTransformer } from '@/transformers/user';

export function updateEmail(payload: EmailChangePayload) {
  return apiRequest<MessageSuccessResponseApi>('/api/v1/user/email/changes', {
    method: 'PATCH',
    body: JSON.stringify(emailChangeTransformer.toApi(payload)),
  });
}
