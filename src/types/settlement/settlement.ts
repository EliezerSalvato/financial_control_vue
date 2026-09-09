import type { YearMonth } from '@/types/api';

export type SettlementProcessingPayload = {
  settlement: YearMonth & {
    referenceDate: string | null;
  };
};
