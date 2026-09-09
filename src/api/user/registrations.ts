import type { RegistrationPayload, RegistrationSuccessResponse } from '@/types/user';
import { apiRequest } from '@/api/client';
import { registrationTransformer } from '@/transformers/user';

export function createRegistration(payload: RegistrationPayload) {
  return apiRequest<RegistrationSuccessResponse>('/api/v1/user/registrations', {
    method: 'POST',
    body: JSON.stringify(registrationTransformer.toApi(payload)),
  });
}
