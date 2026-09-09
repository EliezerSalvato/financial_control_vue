import type {
  CreditCardAttributesApi,
  CreditCardCollectionResponseApi,
  CreditCardCreateResponseApi,
  CreditCardResourceItemApi,
} from '@/types/credit_card';
import { describe, expect, it } from 'vitest';
import { creditCardCollectionFromApi, creditCardCreateFromApi, creditCardFromResource, creditCardShowFromApi } from '@/transformers/credit_card';

const resource: CreditCardResourceItemApi = {
  id: 'cc-1',
  type: 'credit_card',
  attributes: {
    id: 'cc-1',
    institutionId: 'inst-1',
    defaultPaymentAccountId: 'acc-1',
    name: 'Nubank',
    totalLimit: '5000.00',
    availableLimit: '1234.56',
    allowNegativeAvailableLimit: true,
    closingDay: 10,
    dueDay: 17,
    network: 'mastercard',
    active: true,
  },
};

describe('creditCardFromResource', () => {
  it('converte limites decimais e mapeia o recurso', () => {
    expect(creditCardFromResource(resource)).toEqual({
      id: 'cc-1',
      institutionId: 'inst-1',
      defaultPaymentAccountId: 'acc-1',
      name: 'Nubank',
      totalLimit: 5000,
      availableLimit: 1234.56,
      allowNegativeAvailableLimit: true,
      closingDay: 10,
      dueDay: 17,
      network: 'mastercard',
      active: true,
    });
  });

  it('usa id do recurso e default de limite negativo quando o atributo falta', () => {
    expect(
      creditCardFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: {
          institutionId: 'inst-1',
          defaultPaymentAccountId: 'acc-1',
          name: 'Visa',
          totalLimit: '',
          availableLimit: 'not-a-number',
          closingDay: 1,
          dueDay: 10,
          network: 'visa',
          active: false,
        } as CreditCardAttributesApi,
      }),
    ).toMatchObject({
      id: 'fallback-id',
      totalLimit: 0,
      availableLimit: 0,
      allowNegativeAvailableLimit: false,
    });
  });
});

describe('credit card collection / show / create', () => {
  it('inclui paginação na listagem', () => {
    const response: CreditCardCollectionResponseApi = {
      status: 'success',
      type: 'collection',
      data: [resource],
      meta: {
        page: 2,
        per_page: 10,
        count: 11,
        pages: 2,
        next_page: null,
        prev_page: 1,
      },
    };

    expect(creditCardCollectionFromApi(response)).toEqual({
      creditCards: [creditCardFromResource(resource)],
      pagination: {
        currentPage: 2,
        prevPage: 1,
        nextPage: null,
        totalPages: 2,
        totalCount: 11,
        offsetValue: 10,
        size: 1,
      },
    });
  });

  it('devolve o cartão no show e a mensagem no create', () => {
    const created: CreditCardCreateResponseApi = {
      status: 'success',
      type: 'object',
      message: 'Credit card created',
      data: resource,
    };

    expect(creditCardShowFromApi(created)).toEqual(creditCardFromResource(resource));
    expect(creditCardCreateFromApi(created)).toEqual({
      message: 'Credit card created',
      creditCard: creditCardFromResource(resource),
    });
  });
});
