import type {
  MonthlyStatusProcessingUpdate,
  MonthlyStatusShowParams,
  MonthlyStatusShowResult,
  MonthlyStatusSuccessResponseApi,
  MonthlyStatusUpdatePayload,
  MonthlyStatusUpdateResult,
} from '@/types/monthly_status';
import { subscribeToChannel } from '@/api/cable';
import { apiRequest } from '@/api/client';
import { keysToSnakeCase } from '@/utils/case';
import { monthlyStatusProcessingFromApi, monthlyStatusShowFromApi, monthlyStatusUpdateFromApi } from '@/transformers/monthly_status';

function buildShowPath(params: MonthlyStatusShowParams): string {
  const search = new URLSearchParams();

  search.set('month', String(params.month));
  search.set('year', String(params.year));

  return `/api/v1/monthly_statuses?${search.toString()}`;
}

export async function getMonthlyStatus(params: MonthlyStatusShowParams): Promise<MonthlyStatusShowResult> {
  const response = await apiRequest<MonthlyStatusSuccessResponseApi>(buildShowPath(params));

  return monthlyStatusShowFromApi(response);
}

export async function updateMonthlyStatus(payload: MonthlyStatusUpdatePayload): Promise<MonthlyStatusUpdateResult> {
  const response = await apiRequest<MonthlyStatusSuccessResponseApi>('/api/v1/monthly_statuses', {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return monthlyStatusUpdateFromApi(response);
}

export function subscribeMonthlyStatusProcessing(
  params: MonthlyStatusShowParams,
  onUpdate: (update: MonthlyStatusProcessingUpdate) => void,
): () => void {
  return subscribeToChannel({
    channel: 'MonthlyStatusChannel',
    params: { month: params.month, year: params.year },
    onMessage: (message) => {
      onUpdate(monthlyStatusProcessingFromApi(message));
    },
  });
}
