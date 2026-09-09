import type { CollectionListResult, JsonApiResource, JsonApiUnpaginatedCollectionResponse, YearMonth } from '@/types/api';
import type { LimitConsumptionType, TransactionKind, TransactionPaymentMethod, TransactionRecurrenceType, TransactionStatus } from './transaction';

export type SettledTransaction = {
  id: string;
  transactionId: string;
  categoryId: string | null;
  description: string;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod: TransactionPaymentMethod | null;
  recurrenceType: TransactionRecurrenceType;
  installmentsCount: number | null;
  endsOn: string | null;
  canceledOn: string | null;
  occurredOn: string;
  settledOn: string;
  value: number;
  installmentNumber: number | null;
  accountId: string | null;
  creditCardId: string | null;
  limitConsumptionType: LimitConsumptionType | null;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
};

export type SettledTransactionAttributesApi = {
  id: string;
  transactionId: string;
  categoryId?: string | null;
  description: string;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod?: TransactionPaymentMethod | null;
  recurrenceType: TransactionRecurrenceType;
  installmentsCount?: number | null;
  endsOn?: string | null;
  canceledOn?: string | null;
  occurredOn: string;
  settledOn: string;
  value: string | number;
  installmentNumber?: number | null;
  accountId?: string | null;
  creditCardId?: string | null;
  limitConsumptionType?: LimitConsumptionType | null;
  sourceAccountId?: string | null;
  destinationAccountId?: string | null;
};

export type SettledTransactionResourceItemApi = JsonApiResource<'settled_transaction', SettledTransactionAttributesApi>;

export type SettledTransactionCollectionResponseApi = JsonApiUnpaginatedCollectionResponse<SettledTransactionResourceItemApi>;

export type SettledTransactionType = 'account' | 'credit_card' | 'transfer_between_accounts';

export type SettledTransactionListParams = YearMonth & {
  type?: SettledTransactionType;
};

export type SettledTransactionListResult = CollectionListResult<'settledTransactions', SettledTransaction>;
