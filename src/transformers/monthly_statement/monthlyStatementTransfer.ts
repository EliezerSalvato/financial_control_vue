import type {
  MonthlyStatementTransfer,
  MonthlyStatementTransferAttributesApi,
  MonthlyStatementTransferCollectionResponseApi,
  MonthlyStatementTransferListResult,
  MonthlyStatementTransferResourceItemApi,
} from '@/types/monthly_statement';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function monthlyStatementTransferFromResource(resource: MonthlyStatementTransferResourceItemApi): MonthlyStatementTransfer {
  const attributes = keysToCamelCase<MonthlyStatementTransferAttributesApi>(resource.attributes);

  return {
    id: attributes.id ?? resource.id,
    kind: attributes.kind,
    description: attributes.description,
    recurrenceType: attributes.recurrenceType,
    sourceAccountId: attributes.sourceAccountId,
    sourceAccountName: attributes.sourceAccountName,
    sourceAccountBrand: attributes.sourceAccountBrand ?? null,
    destinationAccountId: attributes.destinationAccountId,
    destinationAccountName: attributes.destinationAccountName,
    destinationAccountBrand: attributes.destinationAccountBrand ?? null,
    openingDate: attributes.openingDate,
    closingDate: attributes.closingDate,
    value: toDecimal(attributes.value),
    firstRecurrenceOn: attributes.firstRecurrenceOn,
    currentRecurrenceOn: attributes.currentRecurrenceOn,
    startsOn: attributes.startsOn,
    endsOn: attributes.endsOn ?? null,
    canceledOn: attributes.canceledOn ?? null,
  };
}

export function monthlyStatementTransferCollectionFromApi(
  response: MonthlyStatementTransferCollectionResponseApi,
): MonthlyStatementTransferListResult {
  return {
    monthlyStatementTransfers: response.data.map(monthlyStatementTransferFromResource),
  };
}
