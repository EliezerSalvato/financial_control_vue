import type { TransactionKind, TransactionRecurrenceType } from '@/types/transaction';

export type MonthlyStatementTransfer = {
  id: string;
  kind: TransactionKind;
  description: string;
  recurrenceType: TransactionRecurrenceType;
  sourceAccountId: string;
  sourceAccountName: string;
  sourceAccountBrand: string | null;
  destinationAccountId: string;
  destinationAccountName: string;
  destinationAccountBrand: string | null;
  openingDate: string;
  closingDate: string;
  value: number;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  startsOn: string;
  endsOn: string | null;
  canceledOn: string | null;
};

export type MonthlyStatementTransferAttributesApi = {
  id: string;
  kind: TransactionKind;
  description: string;
  recurrenceType: TransactionRecurrenceType;
  sourceAccountId: string;
  sourceAccountName: string;
  sourceAccountBrand?: string | null;
  destinationAccountId: string;
  destinationAccountName: string;
  destinationAccountBrand?: string | null;
  openingDate: string;
  closingDate: string;
  value: string | number;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  startsOn: string;
  endsOn?: string | null;
  canceledOn?: string | null;
};

export type MonthlyStatementTransferResourceItemApi = {
  id: string;
  type: 'monthly_statement_transfer';
  attributes: MonthlyStatementTransferAttributesApi;
};

export type MonthlyStatementTransferCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: MonthlyStatementTransferResourceItemApi[];
};

export type MonthlyStatementTransferListResult = {
  monthlyStatementTransfers: MonthlyStatementTransfer[];
};
