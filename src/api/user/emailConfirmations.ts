import type { EmailConfirmationPayload, EmailConfirmationSuccessResponse } from '@/types/user';
import { apiRequest } from '@/api/client';

export function createEmailConfirmation(payload: EmailConfirmationPayload) {
  return apiRequest<EmailConfirmationSuccessResponse>('/api/v1/user/email/confirmations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
