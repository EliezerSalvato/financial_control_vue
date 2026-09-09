import type { AccountAttributesApi, AccountCollectionResponseApi, AccountCreateResponseApi, AccountResourceItemApi } from '@/types/account';
import { describe, expect, it } from 'vitest';
import { accountCollectionFromApi, accountCreateFromApi, accountFromResource, accountShowFromApi } from '@/transformers/account';

const resource: AccountResourceItemApi = {
  id: 'acc-1',
  type: 'account',
  attributes: {
    id: 'acc-1',
    name: 'Nubank',
    kind: 'bank_account',
    institutionId: 'inst-1',
    bankAccountType: 'checking',
    currentBalance: '150.50',
    allowNegativeBalance: true,
    color: '#112233',
    active: true,
  },
};

describe('accountFromResource', () => {
  it('converte saldo decimal e mapeia o recurso', () => {
    expect(accountFromResource(resource)).toEqual({
      id: 'acc-1',
      name: 'Nubank',
      kind: 'bank_account',
      institutionId: 'inst-1',
      bankAccountType: 'checking',
      currentBalance: 150.5,
      allowNegativeBalance: true,
      color: '#112233',
      active: true,
    });
  });

  it('usa id do recurso e defaults quando atributos faltam', () => {
    expect(
      accountFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: {
          name: 'Carteira',
          kind: 'cash',
          currentBalance: '',
          active: false,
        } as AccountAttributesApi,
      }),
    ).toEqual({
      id: 'fallback-id',
      name: 'Carteira',
      kind: 'cash',
      institutionId: null,
      bankAccountType: null,
      currentBalance: 0,
      allowNegativeBalance: false,
      color: '#000000',
      active: false,
    });
  });
});

describe('account collection / show / create', () => {
  it('inclui paginação na listagem', () => {
    const response: AccountCollectionResponseApi = {
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

    expect(accountCollectionFromApi(response)).toEqual({
      accounts: [accountFromResource(resource)],
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

  it('devolve a conta no show e a mensagem no create', () => {
    const created: AccountCreateResponseApi = {
      status: 'success',
      type: 'object',
      message: 'Account created',
      data: resource,
    };

    expect(accountShowFromApi(created)).toEqual(accountFromResource(resource));
    expect(accountCreateFromApi(created)).toEqual({
      message: 'Account created',
      account: accountFromResource(resource),
    });
  });
});
