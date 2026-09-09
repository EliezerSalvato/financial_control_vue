import type { SessionRefreshPayload, SessionRefreshSuccessResponseApi } from '@/types/auth';
import { apiRequest } from '@/api/client';
import { sessionRefreshTransformer } from '@/transformers/auth';

export async function refreshSession(payload: SessionRefreshPayload) {
  const response = await apiRequest<SessionRefreshSuccessResponseApi>('/api/v1/user/session/refreshes', {
    method: 'PATCH',
    body: JSON.stringify(sessionRefreshTransformer.toApi(payload)),
    skipAuthRetry: true,
  });

  return sessionRefreshTransformer.fromApi(response);
}
