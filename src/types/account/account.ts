import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';

export type AccountKind = 'bank_account' | 'cash';

export type BankAccountType = 'checking' | 'savings' | 'investment' | 'salary';

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  institutionId: string | null;
  bankAccountType: BankAccountType | null;
  currentBalance: number;
  allowNegativeBalance: boolean;
  color: string;
  active: boolean;
};

export type AccountAttributesApi = {
  id: string;
  name: string;
  kind: AccountKind;
  institutionId?: string | null;
  bankAccountType?: BankAccountType | null;
  currentBalance: string | number;
  allowNegativeBalance: boolean;
  color: string;
  active: boolean;
};

export type AccountResourceItemApi = {
  id: string;
  type: 'account';
  attributes: AccountAttributesApi;
};

export type AccountCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: AccountResourceItemApi[];
  meta: PaginationMetaApi;
};

export type AccountListFilters = {
  nameCont?: string;
  kindEq?: AccountKind;
  bankAccountTypeEq?: BankAccountType;
  activeEq?: boolean;
};

export type AccountListParams = {
  page?: number;
  perPage?: number;
  filters?: AccountListFilters;
  sort?: string;
};

export type AccountListResult = {
  accounts: Account[];
  pagination: Pagination;
};

export type { MessageSuccessResponseApi } from '@/types/api';

export type AccountForm = {
  name: string;
  kind: AccountKind | '';
  institutionId: string;
  bankAccountType: BankAccountType | '';
  currentBalance: number | null;
  allowNegativeBalance: boolean;
  color: string;
  active: boolean;
};

export type AccountCreatePayload = {
  account: {
    name: string;
    kind: AccountKind;
    color: string;
    currentBalance?: number;
    allowNegativeBalance?: boolean;
    active?: boolean;
    institutionId?: string;
    bankAccountType?: BankAccountType;
  };
};

export type AccountUpdatePayload = AccountCreatePayload;

export type AccountSuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: AccountResourceItemApi;
};

export type AccountCreateResponseApi = AccountSuccessResponseApi & {
  message: string;
};

export type AccountCreateResult = {
  message: string;
  account: Account;
};

export type AccountUpdateResult = AccountCreateResult;

export type AccountShowResult = Account;
