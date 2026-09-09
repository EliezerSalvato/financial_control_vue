import type {
  MonthlyStatus,
  MonthlyStatusAttributesApi,
  MonthlyStatusProcessingUpdate,
  MonthlyStatusResourceItemApi,
  MonthlyStatusShowResult,
  MonthlyStatusSuccessResponseApi,
  MonthlyStatusUpdateResult,
} from '@/types/monthly_status';
import { keysToCamelCase } from '@/utils/case';

export function monthlyStatusFromResource(resource: MonthlyStatusResourceItemApi): MonthlyStatus {
  const attributes = keysToCamelCase<MonthlyStatusAttributesApi>(resource.attributes);

  return {
    id: attributes.id ?? resource.id,
    month: attributes.month,
    year: attributes.year,
    status: attributes.status,
    processing: attributes.processing ?? false,
    lastProcessedAt: attributes.lastProcessedAt || null,
  };
}

export function monthlyStatusShowFromApi(response: MonthlyStatusSuccessResponseApi): MonthlyStatusShowResult {
  return monthlyStatusFromResource(response.data);
}

export function monthlyStatusUpdateFromApi(response: MonthlyStatusSuccessResponseApi): MonthlyStatusUpdateResult {
  return {
    message: response.message ?? '',
    monthlyStatus: monthlyStatusFromResource(response.data),
  };
}

export function monthlyStatusProcessingFromApi(payload: unknown): MonthlyStatusProcessingUpdate {
  const attributes = keysToCamelCase<MonthlyStatusProcessingUpdate>(payload);

  return {
    processing: Boolean(attributes.processing),
    lastProcessedAt: attributes.lastProcessedAt || null,
  };
}
