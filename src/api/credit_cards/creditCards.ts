import type { MessageSuccessResponseApi } from '@/types/api';
import type {
  CreditCardCollectionResponseApi,
  CreditCardCreatePayload,
  CreditCardCreateResponseApi,
  CreditCardCreateResult,
  CreditCardListParams,
  CreditCardListResult,
  CreditCardShowResult,
  CreditCardSuccessResponseApi,
  CreditCardUpdatePayload,
  CreditCardUpdateResult,
  InvoiceSettlementCollectionResponseApi,
  InvoiceSettlementListParams,
  InvoiceSettlementListResult,
} from '@/types/credit_card';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import {
  creditCardCollectionFromApi,
  creditCardCreateFromApi,
  creditCardShowFromApi,
  creditCardUpdateFromApi,
  invoiceSettlementCollectionFromApi,
} from '@/transformers/credit_card';

export async function listCreditCards(params: CreditCardListParams = {}): Promise<CreditCardListResult> {
  const response = await apiRequest<CreditCardCollectionResponseApi>(buildRansackListPath('/api/v1/credit_cards', params));

  return creditCardCollectionFromApi(response);
}

function buildInvoiceSettlementsPath(params: InvoiceSettlementListParams): string {
  const search = new URLSearchParams();

  search.set('month', String(params.month));
  search.set('year', String(params.year));

  return `/api/v1/credit_cards/invoice_settlements?${search.toString()}`;
}

export async function listInvoiceSettlements(params: InvoiceSettlementListParams): Promise<InvoiceSettlementListResult> {
  const response = await apiRequest<InvoiceSettlementCollectionResponseApi>(buildInvoiceSettlementsPath(params));

  return invoiceSettlementCollectionFromApi(response);
}

export function deleteCreditCard(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/credit_cards/${id}`, {
    method: 'DELETE',
  });
}

export async function getCreditCard(id: string | number): Promise<CreditCardShowResult> {
  const response = await apiRequest<CreditCardSuccessResponseApi>(`/api/v1/credit_cards/${id}`);

  return creditCardShowFromApi(response);
}

export async function createCreditCard(payload: CreditCardCreatePayload): Promise<CreditCardCreateResult> {
  const response = await apiRequest<CreditCardCreateResponseApi>('/api/v1/credit_cards', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return creditCardCreateFromApi(response);
}

export async function updateCreditCard(id: string | number, payload: CreditCardUpdatePayload): Promise<CreditCardUpdateResult> {
  const response = await apiRequest<CreditCardCreateResponseApi>(`/api/v1/credit_cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return creditCardUpdateFromApi(response);
}
