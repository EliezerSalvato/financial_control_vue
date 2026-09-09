import type { PasswordChangePayload, PasswordChangeSuccessResponse } from '@/types/user';
import { apiRequest } from '@/api/client';
import { passwordChangeTransformer } from '@/transformers/user';

export function updatePassword(payload: PasswordChangePayload) {
  return apiRequest<PasswordChangeSuccessResponse>('/api/v1/user/password/changes', {
    method: 'PATCH',
    body: JSON.stringify(passwordChangeTransformer.toApi(payload)),
  });
}
