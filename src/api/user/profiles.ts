import type { ProfileUpdatePayload, ProfileUpdateSuccessResponse } from '@/types/user';
import { apiRequest } from '@/api/client';
import { profileTransformer } from '@/transformers/user';

export function updateProfile(payload: ProfileUpdatePayload) {
  return apiRequest<ProfileUpdateSuccessResponse>('/api/v1/user/profiles', {
    method: 'PATCH',
    body: JSON.stringify(profileTransformer.toApi(payload)),
  });
}
