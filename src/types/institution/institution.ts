import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

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

export type InstitutionResourceItemApi = JsonApiResource<'institution', InstitutionAttributesApi>;

export type InstitutionCollectionResponseApi = JsonApiCollectionResponse<InstitutionResourceItemApi>;

export type InstitutionListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type InstitutionListParams = ListParams<InstitutionListFilters>;

export type InstitutionListResult = PaginatedListResult<'institutions', Institution>;

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

export type InstitutionSuccessResponseApi = JsonApiObjectResponse<InstitutionResourceItemApi>;

export type InstitutionCreateResponseApi = JsonApiCreateResponse<InstitutionResourceItemApi>;

export type InstitutionCreateResult = MutationResult<'institution', Institution>;

export type InstitutionUpdateResult = InstitutionCreateResult;

export type InstitutionShowResult = Institution;
