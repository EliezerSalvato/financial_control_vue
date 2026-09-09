import type { MessageSuccessResponseApi } from '@/types/api';
import type { EmailConfirmationPayload } from '@/types/user';
import { apiRequest } from '@/api/client';

export function createEmailConfirmation(payload: EmailConfirmationPayload) {
  return apiRequest<MessageSuccessResponseApi>('/api/v1/user/email/confirmations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
