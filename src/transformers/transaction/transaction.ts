import type {
  Transaction,
  TransactionAttributesApi,
  TransactionCollectionResponseApi,
  TransactionCreateResponseApi,
  TransactionCreateResult,
  TransactionListResult,
  TransactionRecurrence,
  TransactionRecurrenceAttributesApi,
  TransactionRecurrenceResourceItemApi,
  TransactionResourceItemApi,
  TransactionCancelResult,
  TransactionShowResult,
  TransactionSuccessResponseApi,
  TransactionUpdateResult,
} from '@/types/transaction';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

function recurrenceFromApi(resource: TransactionRecurrenceResourceItemApi): TransactionRecurrence {
  const attributes = keysToCamelCase<TransactionRecurrenceAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    startsOn: attributes.startsOn,
    value: toDecimal(attributes.value),
  };
}

export function transactionFromResource(resource: TransactionResourceItemApi): Transaction {
  const attributes = keysToCamelCase<TransactionAttributesApi>(resource.attributes);
  const recurrences = (attributes.recurrences ?? []).map(recurrenceFromApi).sort((left, right) => left.startsOn.localeCompare(right.startsOn));
  const firstRecurrence = recurrences[0];

  return {
    id: resourceId(attributes, resource),
    categoryId: attributes.categoryId ?? null,
    description: attributes.description,
    kind: attributes.kind,
    status: attributes.status,
    paymentMethod: attributes.paymentMethod ?? null,
    recurrenceType: attributes.recurrenceType,
    installmentsCount: attributes.installmentsCount ?? null,
    endsOn: attributes.endsOn ?? null,
    accountId: attributes.accountId ?? null,
    creditCardId: attributes.creditCardId ?? null,
    limitConsumptionType: attributes.limitConsumptionType ?? null,
    sourceAccountId: attributes.sourceAccountId ?? null,
    destinationAccountId: attributes.destinationAccountId ?? null,
    tagIds: attributes.tagIds ?? [],
    recurrences,
    value: firstRecurrence?.value ?? 0,
    currentValue: toDecimal(attributes.currentValue ?? firstRecurrence?.value),
    startsOn: firstRecurrence?.startsOn ?? null,
  };
}

export function transactionCollectionFromApi(response: TransactionCollectionResponseApi): TransactionListResult {
  return collectionFromApi(response, transactionFromResource, 'transactions');
}

export function transactionShowFromApi(response: TransactionSuccessResponseApi): TransactionShowResult {
  return transactionFromResource(response.data);
}

export function transactionCreateFromApi(response: TransactionCreateResponseApi): TransactionCreateResult {
  return createResultFromApi(response, transactionFromResource, 'transaction');
}

export function transactionUpdateFromApi(response: TransactionCreateResponseApi): TransactionUpdateResult {
  return transactionCreateFromApi(response);
}

export function transactionCancelFromApi(response: TransactionCreateResponseApi): TransactionCancelResult {
  return transactionCreateFromApi(response);
}
