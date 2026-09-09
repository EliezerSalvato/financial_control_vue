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

export type MonthlyStatusResourceItemApi = {
  id: string;
  type: 'monthly_status';
  attributes: MonthlyStatusAttributesApi;
};

export type MonthlyStatusSuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: MonthlyStatusResourceItemApi;
};

export type MonthlyStatusProcessingPayloadApi = {
  processing: boolean;
  last_processed_at: string | null;
};

export type MonthlyStatusProcessingUpdate = {
  processing: boolean;
  lastProcessedAt: string | null;
};

export type MonthlyStatusShowParams = {
  month: number;
  year: number;
};

export type MonthlyStatusShowResult = MonthlyStatus;

export type MonthlyStatusUpdatePayload = {
  monthlyStatus: {
    month: number;
    year: number;
    status: MonthlyStatusKind;
  };
};

export type MonthlyStatusUpdateResult = {
  message: string;
  monthlyStatus: MonthlyStatus;
};
