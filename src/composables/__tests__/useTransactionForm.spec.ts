import type { TransactionForm } from '@/types/transaction';
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { getAccount, listAccounts } from '@/api/accounts';
import { getCategory, listCategories } from '@/api/categories';
import { getCreditCard, listCreditCards } from '@/api/credit_cards';
import { getTag, listTags } from '@/api/tags';
import { emptyTransactionForm, useTransactionForm } from '@/composables/useTransactionForm';
import i18n from '@/locales';

vi.mock('@/api/categories', () => ({
  listCategories: vi.fn<() => void>(),
  getCategory: vi.fn<() => void>(),
}));

vi.mock('@/api/accounts', () => ({
  listAccounts: vi.fn<() => void>(),
  getAccount: vi.fn<() => void>(),
}));

vi.mock('@/api/credit_cards', () => ({
  listCreditCards: vi.fn<() => void>(),
  getCreditCard: vi.fn<() => void>(),
}));

vi.mock('@/api/tags', () => ({
  listTags: vi.fn<() => void>(),
  getTag: vi.fn<() => void>(),
}));

function mountForm(initial?: Partial<TransactionForm>) {
  let api!: ReturnType<typeof useTransactionForm>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useTransactionForm(initial);
        return () => null;
      },
    }),
    { global: { plugins: [i18n] } },
  );

  return { api, wrapper };
}

describe('emptyTransactionForm', () => {
  it('devolve o formulário em branco', () => {
    expect(emptyTransactionForm()).toMatchObject({
      description: '',
      kind: '',
      paymentMethod: '',
      recurrenceType: '',
      startsOn: null,
      value: null,
      tagIds: [],
    });
  });
});

describe('useTransactionForm', () => {
  let wrapper: VueWrapper | undefined;

  beforeEach(() => {
    vi.mocked(listCategories).mockReset();
    vi.mocked(listAccounts).mockReset();
    vi.mocked(listCreditCards).mockReset();
    vi.mocked(listTags).mockReset();
    vi.mocked(getCategory).mockReset();
    vi.mocked(getAccount).mockReset();
    vi.mocked(getCreditCard).mockReset();
    vi.mocked(getTag).mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('aplica o estado inicial e deriva flags de tipo e pagamento', () => {
    const mounted = mountForm({ kind: 'expense', paymentMethod: 'credit_card', recurrenceType: 'installment' });
    wrapper = mounted.wrapper;
    const { api } = mounted;

    expect(api.isIncomeOrExpense.value).toBe(true);
    expect(api.isCreditCardPayment.value).toBe(true);
    expect(api.isAccountPayment.value).toBe(false);
    expect(api.showInstallmentsCount.value).toBe(true);
    expect(api.showEndsOn.value).toBe(false);
    expect(api.showLimitConsumptionType.value).toBe(true);
    expect(api.startsOnLabel.value).toBe('Starts on');
    expect(api.paymentMethodItems.value).toHaveProperty('credit_card');
  });

  it('trata transferência e métodos de conta', () => {
    const mounted = mountForm({ kind: 'transfer_between_accounts' });
    wrapper = mounted.wrapper;
    const { api } = mounted;

    expect(api.isTransfer.value).toBe(true);
    expect(api.isIncomeOrExpense.value).toBe(false);

    api.form.kind = 'income';
    api.form.paymentMethod = 'pix';
    expect(api.isAccountPayment.value).toBe(true);
    expect(api.paymentMethodItems.value).not.toHaveProperty('credit_card');
    expect(api.paymentMethodItems.value).toHaveProperty('pix');

    api.form.recurrenceType = 'one_time';
    expect(api.startsOnLabel.value).toBe('Date');
    api.form.recurrenceType = 'recurring';
    expect(api.showEndsOn.value).toBe(true);
  });

  it('calcula endsOn a partir das parcelas', () => {
    const mounted = mountForm({
      recurrenceType: 'installment',
      startsOn: '2026-01-31',
      installmentsCount: 3,
    });
    wrapper = mounted.wrapper;
    const { api } = mounted;

    api.syncEndsOnFromInstallments();
    expect(api.form.endsOn).toBe('2026-03-31');

    api.form.recurrenceType = 'one_time';
    api.form.endsOn = null;
    api.syncEndsOnFromInstallments();
    expect(api.form.endsOn).toBeNull();
  });

  it('carrega as opções ativas e ignora falhas', async () => {
    vi.mocked(listCategories).mockResolvedValue({
      categories: [{ id: 'cat-1', name: 'Moradia', color: '#111', active: true, goalEndsOn: null, currentGoal: null, goals: [] }],
      pagination: {
        currentPage: 1,
        prevPage: null,
        nextPage: null,
        totalPages: 1,
        totalCount: 1,
        offsetValue: 0,
        size: 1,
      },
    });
    vi.mocked(listAccounts).mockRejectedValue(new Error('fail'));
    vi.mocked(listCreditCards).mockResolvedValue({
      creditCards: [
        {
          id: 'cc-1',
          institutionId: 'inst-1',
          defaultPaymentAccountId: 'acc-1',
          name: 'Nubank',
          totalLimit: 1,
          availableLimit: 1,
          allowNegativeAvailableLimit: false,
          closingDay: 10,
          dueDay: 17,
          network: 'mastercard',
          active: true,
        },
      ],
      pagination: {
        currentPage: 1,
        prevPage: null,
        nextPage: null,
        totalPages: 1,
        totalCount: 1,
        offsetValue: 0,
        size: 1,
      },
    });
    vi.mocked(listTags).mockResolvedValue({
      tags: [{ id: 'tag-1', name: 'Trabalho', color: '#000', active: true, goalEndsOn: null, currentGoal: null, goals: [] }],
      pagination: {
        currentPage: 1,
        prevPage: null,
        nextPage: null,
        totalPages: 1,
        totalCount: 1,
        offsetValue: 0,
        size: 1,
      },
    });

    const mounted = mountForm();
    wrapper = mounted.wrapper;
    await mounted.api.loadOptionLists();
    await flushPromises();

    expect(mounted.api.categoryItems.value).toEqual([{ key: 'cat-1', label: 'Moradia', color: '#111' }]);
    expect(mounted.api.accountItems.value).toEqual([]);
    expect(mounted.api.creditCardItems.value[0]).toMatchObject({ key: 'cc-1', label: 'Nubank' });
    expect(mounted.api.tagItems.value).toEqual([{ key: 'tag-1', label: 'Trabalho', color: '#000' }]);
  });

  it('inclui opção ausente e usa o id como rótulo se a busca falhar', async () => {
    vi.mocked(getCategory).mockResolvedValue({
      id: 'cat-9',
      name: 'Extra',
      color: '#abc',
      active: true,
      goalEndsOn: null,
      currentGoal: null,
      goals: [],
    });
    vi.mocked(getAccount).mockRejectedValue(new Error('missing'));

    const mounted = mountForm();
    wrapper = mounted.wrapper;

    await mounted.api.ensureCategoryOption('cat-9');
    await mounted.api.ensureCategoryOption('cat-9');
    await mounted.api.ensureAccountOption('acc-9');

    expect(getCategory).toHaveBeenCalledTimes(1);
    expect(mounted.api.categoryItems.value).toEqual([{ key: 'cat-9', label: 'Extra', color: '#abc' }]);
    expect(mounted.api.accountItems.value).toEqual([{ key: 'acc-9', label: 'acc-9' }]);
  });
});
