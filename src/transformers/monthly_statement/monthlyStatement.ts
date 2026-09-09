import type {
  MonthlyStatement,
  MonthlyStatementAttributesApi,
  MonthlyStatementCollectionResponseApi,
  MonthlyStatementListResult,
  MonthlyStatementResourceItemApi,
} from '@/types/monthly_statement';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function monthlyStatementFromResource(resource: MonthlyStatementResourceItemApi): MonthlyStatement {
  const attributes = keysToCamelCase<MonthlyStatementAttributesApi>(resource.attributes);

  return {
    id: attributes.id ?? resource.id,
    kind: attributes.kind,
    description: attributes.description,
    paymentMethod: attributes.paymentMethod,
    resourceId: attributes.resourceId,
    resourceName: attributes.resourceName,
    resourceBrand: attributes.resourceBrand ?? null,
    openingDate: attributes.openingDate,
    closingDate: attributes.closingDate,
    dueDate: attributes.dueDate ?? null,
    value: toDecimal(attributes.value),
    recurrenceType: attributes.recurrenceType,
    firstRecurrenceOn: attributes.firstRecurrenceOn,
    currentRecurrenceOn: attributes.currentRecurrenceOn,
    startsOn: attributes.startsOn,
    endsOn: attributes.endsOn ?? null,
    canceledOn: attributes.canceledOn ?? null,
  };
}

export function monthlyStatementCollectionFromApi(response: MonthlyStatementCollectionResponseApi): MonthlyStatementListResult {
  return {
    monthlyStatements: response.data.map(monthlyStatementFromResource),
  };
}
