import type { TransactionKind, TransactionRecurrenceType } from '@/types/transaction';
import type { CollectionListResult, JsonApiResource, JsonApiUnpaginatedCollectionResponse, YearMonth } from '@/types/api';

export type MonthlyStatementPaymentMethod = 'credit_card' | 'account';

export type MonthlyStatement = {
  id: string;
  kind: TransactionKind;
  description: string;
  paymentMethod: MonthlyStatementPaymentMethod;
  resourceId: string;
  resourceName: string;
  resourceBrand: string | null;
  openingDate: string;
  closingDate: string;
  dueDate: string | null;
  value: number;
  recurrenceType: TransactionRecurrenceType;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  startsOn: string;
  endsOn: string | null;
  canceledOn: string | null;
};

export type MonthlyStatementAttributesApi = {
  id: string;
  kind: TransactionKind;
  description: string;
  paymentMethod: MonthlyStatementPaymentMethod;
  resourceId: string;
  resourceName: string;
  resourceBrand?: string | null;
  openingDate: string;
  closingDate: string;
  dueDate?: string | null;
  value: string | number;
  recurrenceType: TransactionRecurrenceType;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  startsOn: string;
  endsOn?: string | null;
  canceledOn?: string | null;
};

export type MonthlyStatementResourceItemApi = JsonApiResource<'monthly_statement', MonthlyStatementAttributesApi>;

export type MonthlyStatementCollectionResponseApi = JsonApiUnpaginatedCollectionResponse<MonthlyStatementResourceItemApi>;

export type MonthlyStatementListParams = YearMonth;

export type MonthlyStatementListResult = CollectionListResult<'monthlyStatements', MonthlyStatement>;
