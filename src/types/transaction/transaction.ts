import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';

export type TransactionKind = 'income' | 'expense' | 'transfer_between_accounts';

export type TransactionStatus = 'pending' | 'active' | 'completed' | 'canceled';

export type TransactionPaymentMethod = 'pix' | 'debit' | 'credit_card' | 'ted' | 'doc' | 'deposit' | 'cash' | 'boleto';

export type TransactionRecurrenceType = 'one_time' | 'installment' | 'recurring';

export type LimitConsumptionType = 'upfront' | 'monthly';

export type TransactionRecurrence = {
  id: string;
  startsOn: string;
  value: number;
};

export type Transaction = {
  id: string;
  categoryId: string | null;
  description: string;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod: TransactionPaymentMethod | null;
  recurrenceType: TransactionRecurrenceType;
  installmentsCount: number | null;
  endsOn: string | null;
  accountId: string | null;
  creditCardId: string | null;
  limitConsumptionType: LimitConsumptionType | null;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  tagIds: string[];
  recurrences: TransactionRecurrence[];
  value: number;
  currentValue: number;
  startsOn: string | null;
};

export type TransactionRecurrenceAttributesApi = {
  id: string;
  startsOn: string;
  value: string | number;
};

export type TransactionRecurrenceResourceItemApi = {
  id: string;
  type: 'transaction_recurrence';
  attributes: TransactionRecurrenceAttributesApi;
};

export type TransactionAttributesApi = {
  id: string;
  categoryId?: string | null;
  description: string;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod?: TransactionPaymentMethod | null;
  recurrenceType: TransactionRecurrenceType;
  installmentsCount?: number | null;
  endsOn?: string | null;
  accountId?: string | null;
  creditCardId?: string | null;
  limitConsumptionType?: LimitConsumptionType | null;
  sourceAccountId?: string | null;
  destinationAccountId?: string | null;
  tagIds?: string[];
  recurrences?: TransactionRecurrenceResourceItemApi[];
  currentValue?: string | number;
};

export type TransactionResourceItemApi = {
  id: string;
  type: 'transaction';
  attributes: TransactionAttributesApi;
};

export type TransactionCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: TransactionResourceItemApi[];
  meta: PaginationMetaApi;
};

export type TransactionListFilters = {
  descriptionCont?: string;
  kindEq?: TransactionKind;
  statusEq?: TransactionStatus;
  paymentMethodEq?: TransactionPaymentMethod;
  recurrenceTypeEq?: TransactionRecurrenceType;
  categoryIdEq?: string;
};

export type TransactionListParams = {
  page?: number;
  perPage?: number;
  filters?: TransactionListFilters;
  sort?: string;
};

export type TransactionListResult = {
  transactions: Transaction[];
  pagination: Pagination;
};

export type { MessageSuccessResponseApi } from '@/types/api';

export type TransactionForm = {
  description: string;
  kind: TransactionKind | '';
  paymentMethod: TransactionPaymentMethod | '';
  recurrenceType: TransactionRecurrenceType | '';
  startsOn: string | null;
  endsOn: string | null;
  installmentsCount: number | null;
  value: number | null;
  categoryId: string;
  accountId: string;
  creditCardId: string;
  limitConsumptionType: LimitConsumptionType | '';
  sourceAccountId: string;
  destinationAccountId: string;
  tagIds: string[];
};

export type TransactionCreatePayload = {
  transaction: {
    description: string;
    kind: TransactionKind;
    paymentMethod?: TransactionPaymentMethod | null;
    recurrenceType: TransactionRecurrenceType;
    startsOn: string;
    endsOn?: string | null;
    value: number;
    categoryId: string;
    accountId?: string;
    creditCardId?: string;
    limitConsumptionType?: LimitConsumptionType | null;
    sourceAccountId?: string;
    destinationAccountId?: string;
    tagIds?: string[];
  };
};

export type TransactionUpdatePayload = {
  transaction: {
    description?: string;
    categoryId: string;
    kind?: TransactionKind;
    paymentMethod?: TransactionPaymentMethod | null;
    recurrenceType?: TransactionRecurrenceType;
    endsOn?: string | null;
    startsOn?: string;
    value?: number;
    limitConsumptionType?: LimitConsumptionType | null;
    accountId?: string | null;
    creditCardId?: string | null;
    sourceAccountId?: string | null;
    destinationAccountId?: string | null;
    tagIds?: string[];
  };
};

export type TransactionSuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: TransactionResourceItemApi;
};

export type TransactionCreateResponseApi = TransactionSuccessResponseApi & {
  message: string;
};

export type TransactionCreateResult = {
  message: string;
  transaction: Transaction;
};

export type TransactionUpdateResult = TransactionCreateResult;

export type TransactionCancelResult = TransactionCreateResult;

export type TransactionShowResult = Transaction;

export type TransactionRecurrenceForm = {
  value: number | null;
  startsOn: string | null;
  changeForNextMonths: boolean;
};

export type TransactionRecurrenceCreatePayload = {
  transactionRecurrence: {
    value: number;
    startsOn: string;
    changeForNextMonths?: boolean;
  };
};

export type TransactionRecurrenceCreateResult = TransactionCreateResult;
