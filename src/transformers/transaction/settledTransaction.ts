import type {
  SettledTransaction,
  SettledTransactionAttributesApi,
  SettledTransactionCollectionResponseApi,
  SettledTransactionListResult,
  SettledTransactionResourceItemApi,
} from '@/types/transaction';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function settledTransactionFromResource(resource: SettledTransactionResourceItemApi): SettledTransaction {
  const attributes = keysToCamelCase<SettledTransactionAttributesApi>(resource.attributes);

  return {
    id: attributes.id ?? resource.id,
    transactionId: attributes.transactionId,
    categoryId: attributes.categoryId ?? null,
    description: attributes.description,
    kind: attributes.kind,
    status: attributes.status,
    paymentMethod: attributes.paymentMethod ?? null,
    recurrenceType: attributes.recurrenceType,
    installmentsCount: attributes.installmentsCount ?? null,
    endsOn: attributes.endsOn ?? null,
    canceledOn: attributes.canceledOn ?? null,
    occurredOn: attributes.occurredOn,
    settledOn: attributes.settledOn,
    value: toDecimal(attributes.value),
    installmentNumber: attributes.installmentNumber ?? null,
    accountId: attributes.accountId ?? null,
    creditCardId: attributes.creditCardId ?? null,
    limitConsumptionType: attributes.limitConsumptionType ?? null,
    sourceAccountId: attributes.sourceAccountId ?? null,
    destinationAccountId: attributes.destinationAccountId ?? null,
  };
}

export function settledTransactionCollectionFromApi(response: SettledTransactionCollectionResponseApi): SettledTransactionListResult {
  return {
    settledTransactions: response.data.map(settledTransactionFromResource),
  };
}
