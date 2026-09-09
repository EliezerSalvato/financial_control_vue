import type { SessionRevokeSuccessResponse } from '@/types/auth';
import { apiRequest } from '@/api/client';

export function revokeSessions() {
  return apiRequest<SessionRevokeSuccessResponse>('/api/v1/user/session/revokes', {
    method: 'DELETE',
  });
}
