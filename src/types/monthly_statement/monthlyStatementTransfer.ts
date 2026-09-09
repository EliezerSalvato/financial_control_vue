import type { TransactionKind, TransactionRecurrenceType } from '@/types/transaction';
import type { CollectionListResult, JsonApiResource, JsonApiUnpaginatedCollectionResponse } from '@/types/api';

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

export type MonthlyStatementTransferResourceItemApi = JsonApiResource<'monthly_statement_transfer', MonthlyStatementTransferAttributesApi>;

export type MonthlyStatementTransferCollectionResponseApi = JsonApiUnpaginatedCollectionResponse<MonthlyStatementTransferResourceItemApi>;

export type MonthlyStatementTransferListResult = CollectionListResult<'monthlyStatementTransfers', MonthlyStatementTransfer>;
