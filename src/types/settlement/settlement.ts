export type { MessageSuccessResponseApi } from '@/types/api';

export type SettlementProcessingPayload = {
  settlement: {
    month: number;
    year: number;
    referenceDate: string | null;
  };
};
