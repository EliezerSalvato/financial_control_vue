import type { MessageSuccessResponseApi } from '@/types/api';
import type { SettlementProcessingPayload } from '@/types/settlement';
import { apiRequest } from '@/api/client';
import { keysToSnakeCase } from '@/utils/case';

export function processSettlements(payload: SettlementProcessingPayload) {
  return apiRequest<MessageSuccessResponseApi>('/api/v1/settlements/processing', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });
}
