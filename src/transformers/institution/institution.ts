import type {
  Institution,
  InstitutionAttributesApi,
  InstitutionCollectionResponseApi,
  InstitutionCreateResponseApi,
  InstitutionCreateResult,
  InstitutionListResult,
  InstitutionResourceItemApi,
  InstitutionShowResult,
  InstitutionSuccessResponseApi,
  InstitutionUpdateResult,
} from '@/types/institution';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';

export function institutionFromResource(resource: InstitutionResourceItemApi): Institution {
  const attributes = keysToCamelCase<InstitutionAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    logoKey: attributes.logoKey,
    active: attributes.active,
  };
}

export function institutionCollectionFromApi(response: InstitutionCollectionResponseApi): InstitutionListResult {
  return collectionFromApi(response, institutionFromResource, 'institutions');
}

export function institutionShowFromApi(response: InstitutionSuccessResponseApi): InstitutionShowResult {
  return institutionFromResource(response.data);
}

export function institutionCreateFromApi(response: InstitutionCreateResponseApi): InstitutionCreateResult {
  return createResultFromApi(response, institutionFromResource, 'institution');
}

export function institutionUpdateFromApi(response: InstitutionCreateResponseApi): InstitutionUpdateResult {
  return institutionCreateFromApi(response);
}
