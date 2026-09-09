import type { MessageSuccessResponseApi } from '@/types/api';
import { apiRequest } from '@/api/client';

export function revokeSessions() {
  return apiRequest<MessageSuccessResponseApi>('/api/v1/user/session/revokes', {
    method: 'DELETE',
  });
}
