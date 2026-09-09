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

export type InvoiceSettlementResourceItemApi = {
  id: string;
  type: 'credit_card_invoice_settlement';
  attributes: InvoiceSettlementAttributesApi;
};

export type InvoiceSettlementCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: InvoiceSettlementResourceItemApi[];
};

export type InvoiceSettlementListParams = {
  month: number;
  year: number;
};

export type InvoiceSettlementListResult = {
  invoiceSettlements: InvoiceSettlement[];
};
