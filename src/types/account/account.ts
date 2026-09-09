import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

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

export type AccountResourceItemApi = JsonApiResource<'account', AccountAttributesApi>;

export type AccountCollectionResponseApi = JsonApiCollectionResponse<AccountResourceItemApi>;

export type AccountListFilters = {
  nameCont?: string;
  kindEq?: AccountKind;
  bankAccountTypeEq?: BankAccountType;
  activeEq?: boolean;
};

export type AccountListParams = ListParams<AccountListFilters>;

export type AccountListResult = PaginatedListResult<'accounts', Account>;

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

export type AccountSuccessResponseApi = JsonApiObjectResponse<AccountResourceItemApi>;

export type AccountCreateResponseApi = JsonApiCreateResponse<AccountResourceItemApi>;

export type AccountCreateResult = MutationResult<'account', Account>;

export type AccountUpdateResult = AccountCreateResult;

export type AccountShowResult = Account;
