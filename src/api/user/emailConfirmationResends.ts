import type { MessageSuccessResponseApi } from '@/types/api';
import type { EmailConfirmationResendPayload } from '@/types/user';
import { apiRequest } from '@/api/client';

export function createEmailConfirmationResend(payload: EmailConfirmationResendPayload) {
  return apiRequest<MessageSuccessResponseApi>('/api/v1/user/email/confirmation_resends', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
