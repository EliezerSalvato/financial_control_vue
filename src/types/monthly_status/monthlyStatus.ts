import type { JsonApiObjectResponse, JsonApiResource, MutationResult, YearMonth } from '@/types/api';

export type MonthlyStatusKind = 'open' | 'closed';

export type MonthlyStatus = {
  id: string;
  month: number;
  year: number;
  status: MonthlyStatusKind;
  processing: boolean;
  lastProcessedAt: string | null;
};

export type MonthlyStatusAttributesApi = {
  id: string;
  month: number;
  year: number;
  status: MonthlyStatusKind;
  processing: boolean;
  lastProcessedAt: string | null;
};

export type MonthlyStatusResourceItemApi = JsonApiResource<'monthly_status', MonthlyStatusAttributesApi>;

export type MonthlyStatusSuccessResponseApi = JsonApiObjectResponse<MonthlyStatusResourceItemApi>;

export type MonthlyStatusProcessingPayloadApi = {
  processing: boolean;
  last_processed_at: string | null;
};

export type MonthlyStatusProcessingUpdate = {
  processing: boolean;
  lastProcessedAt: string | null;
};

export type MonthlyStatusShowParams = YearMonth;

export type MonthlyStatusShowResult = MonthlyStatus;

export type MonthlyStatusUpdatePayload = {
  monthlyStatus: YearMonth & {
    status: MonthlyStatusKind;
  };
};

export type MonthlyStatusUpdateResult = MutationResult<'monthlyStatus', MonthlyStatus>;
