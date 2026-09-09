import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';

export type Institution = {
  id: string;
  name: string;
  logoKey: string;
  active: boolean;
};

export type InstitutionAttributesApi = {
  id: string;
  name: string;
  logoKey: string;
  active: boolean;
};

export type InstitutionResourceItemApi = {
  id: string;
  type: 'institution';
  attributes: InstitutionAttributesApi;
};

export type InstitutionCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: InstitutionResourceItemApi[];
  meta: PaginationMetaApi;
};

export type InstitutionListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type InstitutionListParams = {
  page?: number;
  perPage?: number;
  filters?: InstitutionListFilters;
  sort?: string;
};

export type InstitutionListResult = {
  institutions: Institution[];
  pagination: Pagination;
};

export type { MessageSuccessResponseApi } from '@/types/api';

export type InstitutionForm = {
  name: string;
  logoKey: string;
  active: boolean;
};

export type InstitutionCreatePayload = {
  institution: {
    name: string;
    logoKey: string;
    active?: boolean;
  };
};

export type InstitutionUpdatePayload = InstitutionCreatePayload;

export type InstitutionSuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: InstitutionResourceItemApi;
};

export type InstitutionCreateResponseApi = InstitutionSuccessResponseApi & {
  message: string;
};

export type InstitutionCreateResult = {
  message: string;
  institution: Institution;
};

export type InstitutionUpdateResult = InstitutionCreateResult;

export type InstitutionShowResult = Institution;
