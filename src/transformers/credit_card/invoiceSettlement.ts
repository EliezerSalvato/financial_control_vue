import type {
  InvoiceSettlement,
  InvoiceSettlementAttributesApi,
  InvoiceSettlementCollectionResponseApi,
  InvoiceSettlementListResult,
  InvoiceSettlementResourceItemApi,
} from '@/types/credit_card';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function invoiceSettlementFromResource(resource: InvoiceSettlementResourceItemApi): InvoiceSettlement {
  const attributes = keysToCamelCase<InvoiceSettlementAttributesApi>(resource.attributes);

  return {
    id: attributes.id ?? resource.id,
    creditCardId: attributes.creditCardId,
    paymentAccountId: attributes.paymentAccountId,
    openingDate: attributes.openingDate,
    closingDate: attributes.closingDate,
    dueDate: attributes.dueDate,
    totalValue: toDecimal(attributes.totalValue),
    releasedLimit: toDecimal(attributes.releasedLimit),
    settledOn: attributes.settledOn,
  };
}

export function invoiceSettlementCollectionFromApi(response: InvoiceSettlementCollectionResponseApi): InvoiceSettlementListResult {
  return {
    invoiceSettlements: response.data.map(invoiceSettlementFromResource),
  };
}
