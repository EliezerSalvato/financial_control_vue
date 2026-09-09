import type { CollectionListResult, JsonApiResource, JsonApiUnpaginatedCollectionResponse, YearMonth } from '@/types/api';

export type InvoiceSettlement = {
  id: string;
  creditCardId: string;
  paymentAccountId: string;
  openingDate: string;
  closingDate: string;
  dueDate: string;
  totalValue: number;
  releasedLimit: number;
  settledOn: string;
};

export type InvoiceSettlementAttributesApi = {
  id: string;
  creditCardId: string;
  paymentAccountId: string;
  openingDate: string;
  closingDate: string;
  dueDate: string;
  totalValue: string | number;
  releasedLimit: string | number;
  settledOn: string;
};

export type InvoiceSettlementResourceItemApi = JsonApiResource<'credit_card_invoice_settlement', InvoiceSettlementAttributesApi>;

export type InvoiceSettlementCollectionResponseApi = JsonApiUnpaginatedCollectionResponse<InvoiceSettlementResourceItemApi>;

export type InvoiceSettlementListParams = YearMonth;

export type InvoiceSettlementListResult = CollectionListResult<'invoiceSettlements', InvoiceSettlement>;
