import type { AuthenticationPayload, AuthSessionSuccessResponseApi } from '@/types/auth';
import { apiRequest } from '@/api/client';
import { authenticationTransformer } from '@/transformers/auth';

export async function createAuthentication(payload: AuthenticationPayload) {
  const response = await apiRequest<AuthSessionSuccessResponseApi>('/api/v1/user/authentications', {
    method: 'POST',
    body: JSON.stringify(authenticationTransformer.toApi(payload)),
  });

  return authenticationTransformer.fromApi(response);
}
