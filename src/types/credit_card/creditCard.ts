import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

export type CreditCard = {
  id: string;
  institutionId: string;
  defaultPaymentAccountId: string;
  name: string;
  totalLimit: number;
  availableLimit: number;
  allowNegativeAvailableLimit: boolean;
  closingDay: number;
  dueDay: number;
  network: string;
  active: boolean;
};

export type CreditCardAttributesApi = {
  id: string;
  institutionId: string;
  defaultPaymentAccountId: string;
  name: string;
  totalLimit: string | number;
  availableLimit: string | number;
  allowNegativeAvailableLimit: boolean;
  closingDay: number;
  dueDay: number;
  network: string;
  active: boolean;
};

export type CreditCardResourceItemApi = JsonApiResource<'credit_card', CreditCardAttributesApi>;

export type CreditCardCollectionResponseApi = JsonApiCollectionResponse<CreditCardResourceItemApi>;

export type CreditCardListFilters = {
  nameCont?: string;
  networkCont?: string;
  institutionIdEq?: string;
  defaultPaymentAccountIdEq?: string;
  activeEq?: boolean;
};

export type CreditCardListParams = ListParams<CreditCardListFilters>;

export type CreditCardListResult = PaginatedListResult<'creditCards', CreditCard>;

export type CreditCardForm = {
  institutionId: string;
  defaultPaymentAccountId: string;
  name: string;
  totalLimit: number | null;
  availableLimit: number | null;
  allowNegativeAvailableLimit: boolean;
  closingDay: number | null;
  dueDay: number | null;
  network: string;
  active: boolean;
};

export type CreditCardCreatePayload = {
  creditCard: {
    institutionId: string;
    defaultPaymentAccountId: string;
    name: string;
    totalLimit?: number;
    allowNegativeAvailableLimit?: boolean;
    closingDay: number;
    dueDay: number;
    network: string;
    active?: boolean;
  };
};

export type CreditCardUpdatePayload = {
  creditCard: {
    institutionId: string;
    defaultPaymentAccountId: string;
    name: string;
    totalLimit?: number;
    allowNegativeAvailableLimit?: boolean;
    network: string;
    active?: boolean;
  };
};

export type CreditCardSuccessResponseApi = JsonApiObjectResponse<CreditCardResourceItemApi>;

export type CreditCardCreateResponseApi = JsonApiCreateResponse<CreditCardResourceItemApi>;

export type CreditCardCreateResult = MutationResult<'creditCard', CreditCard>;

export type CreditCardUpdateResult = CreditCardCreateResult;

export type CreditCardShowResult = CreditCard;
