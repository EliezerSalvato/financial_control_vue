import type { PasswordResetPayload, PasswordResetSuccessResponse, PasswordResetUpdatePayload } from '@/types/user';
import { apiRequest } from '@/api/client';
import { passwordResetTransformer } from '@/transformers/user';

export function createPasswordReset(payload: PasswordResetPayload) {
  return apiRequest<PasswordResetSuccessResponse>('/api/v1/user/password/resets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePasswordReset(payload: PasswordResetUpdatePayload) {
  return apiRequest<PasswordResetSuccessResponse>('/api/v1/user/password/resets', {
    method: 'PATCH',
    body: JSON.stringify(passwordResetTransformer.toApi(payload)),
  });
}
