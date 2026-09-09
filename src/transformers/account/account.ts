import type {
  Account,
  AccountAttributesApi,
  AccountCollectionResponseApi,
  AccountCreateResponseApi,
  AccountCreateResult,
  AccountListResult,
  AccountResourceItemApi,
  AccountShowResult,
  AccountSuccessResponseApi,
  AccountUpdateResult,
} from '@/types/account';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function accountFromResource(resource: AccountResourceItemApi): Account {
  const attributes = keysToCamelCase<AccountAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    kind: attributes.kind,
    institutionId: attributes.institutionId ?? null,
    bankAccountType: attributes.bankAccountType ?? null,
    currentBalance: toDecimal(attributes.currentBalance),
    allowNegativeBalance: attributes.allowNegativeBalance ?? false,
    color: attributes.color ?? '#000000',
    active: attributes.active,
  };
}

export function accountCollectionFromApi(response: AccountCollectionResponseApi): AccountListResult {
  return collectionFromApi(response, accountFromResource, 'accounts');
}

export function accountShowFromApi(response: AccountSuccessResponseApi): AccountShowResult {
  return accountFromResource(response.data);
}

export function accountCreateFromApi(response: AccountCreateResponseApi): AccountCreateResult {
  return createResultFromApi(response, accountFromResource, 'account');
}

export function accountUpdateFromApi(response: AccountCreateResponseApi): AccountUpdateResult {
  return accountCreateFromApi(response);
}
