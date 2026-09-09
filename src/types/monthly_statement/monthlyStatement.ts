import type { TransactionKind, TransactionRecurrenceType } from '@/types/transaction';

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

export type MonthlyStatementResourceItemApi = {
  id: string;
  type: 'monthly_statement';
  attributes: MonthlyStatementAttributesApi;
};

export type MonthlyStatementCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: MonthlyStatementResourceItemApi[];
};

export type MonthlyStatementListParams = {
  month: number;
  year: number;
};

export type MonthlyStatementListResult = {
  monthlyStatements: MonthlyStatement[];
};
