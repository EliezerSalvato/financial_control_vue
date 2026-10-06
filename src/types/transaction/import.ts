import type { LimitConsumptionType, TransactionPaymentMethod, TransactionRecurrenceType } from '@/types/transaction/transaction';

export type TransactionImportPreviewPayload = {
  kind: 'income' | 'expense';
  paymentMethod: TransactionPaymentMethod;
  accountId?: string;
  creditCardId?: string;
  file: File;
};

export type TransactionImportPreviewResponseApi = {
  status: 'success';
  message?: string;
  data: {
    import_id: string;
    total_rows: number;
  };
};

export type TransactionImportPreviewResult = {
  importId: string;
  totalRows: number;
};

export type TransactionImportEventStage = 'preview' | 'import';

export type TransactionImportEventStatus = 'processed' | 'skip' | 'error' | 'created' | 'ignored';

export type TransactionImportCategory = {
  id?: string;
  name: string;
  new: boolean;
};

export type TransactionImportTag = {
  id?: string;
  name: string;
  new: boolean;
};

export type TransactionImportPreviewData = {
  date: string;
  description: string;
  originalDescription: string;
  amount: string;
  recurrenceType: TransactionRecurrenceType;
  endsOn: string | null;
  kind: 'income' | 'expense';
  paymentMethod: TransactionPaymentMethod;
  accountId: string | null;
  creditCardId: string | null;
  limitConsumptionType: LimitConsumptionType | null;
  installmentsCount?: number | null;
  category: TransactionImportCategory | null;
  tags: TransactionImportTag[];
  sourceKey: string;
};

export type TransactionImportPreviewRow = TransactionImportPreviewData & {
  row: number;
};

export type TransactionImportEvent = {
  importId: string;
  stage: TransactionImportEventStage;
  row: number;
  status: TransactionImportEventStatus;
  data?: TransactionImportPreviewData;
  transactionId?: string;
  error?: string;
};

export type TransactionImportConfirmRow = {
  row: number;
  create: boolean;
  sourceKey: string;
  date: string;
  description: string;
  amount: string;
  kind: 'income' | 'expense';
  paymentMethod: TransactionPaymentMethod;
  accountId?: string;
  creditCardId?: string;
  limitConsumptionType?: LimitConsumptionType;
  installmentsCount?: number;
  recurrenceType: TransactionRecurrenceType;
  endsOn?: string;
  categoryId?: string;
  categoryName?: string;
  tagIds: string[];
  tagNames: string[];
};

export type TransactionImportConfirmPayload = {
  importId: string;
  rows: TransactionImportConfirmRow[];
};

export type TransactionImportConfirmResult = TransactionImportPreviewResult;

export type TransactionImportPreviewForm = {
  kind: string;
  paymentMethod: string;
  accountId: string;
  creditCardId: string;
  file: File | null;
};
