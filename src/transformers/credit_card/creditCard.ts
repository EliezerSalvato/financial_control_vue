import type {
  CreditCard,
  CreditCardAttributesApi,
  CreditCardCollectionResponseApi,
  CreditCardCreateResponseApi,
  CreditCardCreateResult,
  CreditCardListResult,
  CreditCardResourceItemApi,
  CreditCardShowResult,
  CreditCardSuccessResponseApi,
  CreditCardUpdateResult,
} from '@/types/credit_card';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function creditCardFromResource(resource: CreditCardResourceItemApi): CreditCard {
  const attributes = keysToCamelCase<CreditCardAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    institutionId: attributes.institutionId,
    defaultPaymentAccountId: attributes.defaultPaymentAccountId,
    name: attributes.name,
    totalLimit: toDecimal(attributes.totalLimit),
    availableLimit: toDecimal(attributes.availableLimit),
    allowNegativeAvailableLimit: attributes.allowNegativeAvailableLimit ?? false,
    closingDay: attributes.closingDay,
    dueDay: attributes.dueDay,
    network: attributes.network,
    active: attributes.active,
  };
}

export function creditCardCollectionFromApi(response: CreditCardCollectionResponseApi): CreditCardListResult {
  return collectionFromApi(response, creditCardFromResource, 'creditCards');
}

export function creditCardShowFromApi(response: CreditCardSuccessResponseApi): CreditCardShowResult {
  return creditCardFromResource(response.data);
}

export function creditCardCreateFromApi(response: CreditCardCreateResponseApi): CreditCardCreateResult {
  return createResultFromApi(response, creditCardFromResource, 'creditCard');
}

export function creditCardUpdateFromApi(response: CreditCardCreateResponseApi): CreditCardUpdateResult {
  return creditCardCreateFromApi(response);
}
