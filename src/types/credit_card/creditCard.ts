import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';

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

export type CreditCardResourceItemApi = {
  id: string;
  type: 'credit_card';
  attributes: CreditCardAttributesApi;
};

export type CreditCardCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: CreditCardResourceItemApi[];
  meta: PaginationMetaApi;
};

export type CreditCardListFilters = {
  nameCont?: string;
  networkCont?: string;
  institutionIdEq?: string;
  defaultPaymentAccountIdEq?: string;
  activeEq?: boolean;
};

export type CreditCardListParams = {
  page?: number;
  perPage?: number;
  filters?: CreditCardListFilters;
  sort?: string;
};

export type CreditCardListResult = {
  creditCards: CreditCard[];
  pagination: Pagination;
};

export type { MessageSuccessResponseApi } from '@/types/api';

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

export type CreditCardSuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: CreditCardResourceItemApi;
};

export type CreditCardCreateResponseApi = CreditCardSuccessResponseApi & {
  message: string;
};

export type CreditCardCreateResult = {
  message: string;
  creditCard: CreditCard;
};

export type CreditCardUpdateResult = CreditCardCreateResult;

export type CreditCardShowResult = CreditCard;
