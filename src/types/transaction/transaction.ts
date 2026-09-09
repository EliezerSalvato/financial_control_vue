import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

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

export type TransactionRecurrenceResourceItemApi = JsonApiResource<'transaction_recurrence', TransactionRecurrenceAttributesApi>;

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

export type TransactionResourceItemApi = JsonApiResource<'transaction', TransactionAttributesApi>;

export type TransactionCollectionResponseApi = JsonApiCollectionResponse<TransactionResourceItemApi>;

export type TransactionListFilters = {
  descriptionCont?: string;
  kindEq?: TransactionKind;
  statusEq?: TransactionStatus;
  paymentMethodEq?: TransactionPaymentMethod;
  recurrenceTypeEq?: TransactionRecurrenceType;
  categoryIdEq?: string;
};

export type TransactionListParams = ListParams<TransactionListFilters>;

export type TransactionListResult = PaginatedListResult<'transactions', Transaction>;

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

export type TransactionSuccessResponseApi = JsonApiObjectResponse<TransactionResourceItemApi>;

export type TransactionCreateResponseApi = JsonApiCreateResponse<TransactionResourceItemApi>;

export type TransactionCreateResult = MutationResult<'transaction', Transaction>;

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
