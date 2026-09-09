import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { LogoOption } from '@/components/inputs/LogoSelect.vue';
import type { TransactionForm, TransactionPaymentMethod } from '@/types/transaction';
import { getAccount, listAccounts } from '@/api/accounts';
import { getCategory, listCategories } from '@/api/categories';
import { getCreditCard, listCreditCards } from '@/api/credit_cards';
import { getTag, listTags } from '@/api/tags';
import { addSortedOption } from '@/composables/useCreateOptionModal';
import { useFormErrors } from '@/composables/useFormErrors';
import { useI18n } from 'vue-i18n';
import { addMonthsToIsoDate } from '@/utils/isoDate';
import { networkLogoUrl } from '@/utils/networkLogos';
import { computed, reactive, ref } from 'vue';

export const INCOME_PAYMENT_METHODS: TransactionPaymentMethod[] = ['pix', 'cash', 'boleto', 'deposit', 'ted', 'doc'];
export const EXPENSE_PAYMENT_METHODS: TransactionPaymentMethod[] = ['credit_card', 'pix', 'debit', 'cash', 'boleto', 'deposit', 'ted', 'doc'];
export const ACCOUNT_BASED_METHODS = new Set<TransactionPaymentMethod>(['pix', 'debit', 'ted', 'doc', 'deposit', 'cash', 'boleto']);

export function emptyTransactionForm(): TransactionForm {
  return {
    description: '',
    kind: '',
    paymentMethod: '',
    recurrenceType: '',
    startsOn: null,
    endsOn: null,
    installmentsCount: null,
    value: null,
    categoryId: '',
    accountId: '',
    creditCardId: '',
    limitConsumptionType: '',
    sourceAccountId: '',
    destinationAccountId: '',
    tagIds: [],
  };
}

export function useTransactionForm(initial: Partial<TransactionForm> = {}) {
  const { t } = useI18n();

  const form = reactive<TransactionForm>({ ...emptyTransactionForm(), ...initial });
  const { errors, applyCatch, createHandler } = useFormErrors(form);

  const categoryItems = ref<ColorOption[]>([]);
  const accountItems = ref<ColorOption[]>([]);
  const creditCardItems = ref<LogoOption[]>([]);
  const tagItems = ref<ColorOption[]>([]);

  const isTransfer = computed(() => form.kind === 'transfer_between_accounts');
  const isIncomeOrExpense = computed(() => form.kind === 'income' || form.kind === 'expense');
  const isCreditCardPayment = computed(() => form.kind === 'expense' && form.paymentMethod === 'credit_card');
  const isAccountPayment = computed(() => isIncomeOrExpense.value && ACCOUNT_BASED_METHODS.has(form.paymentMethod as TransactionPaymentMethod));
  const hasRecurrenceType = computed(() => form.recurrenceType !== '');
  const showInstallmentsCount = computed(() => form.recurrenceType === 'installment');
  const showEndsOn = computed(() => form.recurrenceType === 'recurring');
  const showLimitConsumptionType = computed(() => isCreditCardPayment.value && form.recurrenceType === 'installment');
  const startsOnLabel = computed(() => (form.recurrenceType === 'one_time' ? t('transactions.form.date') : t('transactions.form.startsOn')));

  const kindItems = computed(() => ({
    expense: t('transactions.kinds.expense'),
    income: t('transactions.kinds.income'),
    transfer_between_accounts: t('transactions.kinds.transferBetweenAccounts'),
  }));

  const paymentMethodItems = computed(() => {
    const methods = form.kind === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS;
    const labels: Record<string, string> = {
      pix: t('transactions.paymentMethods.pix'),
      debit: t('transactions.paymentMethods.debit'),
      credit_card: t('transactions.paymentMethods.creditCard'),
      ted: t('transactions.paymentMethods.ted'),
      doc: t('transactions.paymentMethods.doc'),
      deposit: t('transactions.paymentMethods.deposit'),
      cash: t('transactions.paymentMethods.cash'),
      boleto: t('transactions.paymentMethods.boleto'),
    };

    return Object.fromEntries(methods.map((method) => [method, labels[method] ?? method]));
  });

  const recurrenceTypeItems = computed(() => ({
    one_time: t('transactions.recurrenceTypes.oneTime'),
    installment: t('transactions.recurrenceTypes.installment'),
    recurring: t('transactions.recurrenceTypes.recurring'),
  }));

  const limitConsumptionTypeItems = computed(() => ({
    upfront: t('transactions.limitConsumptionTypes.upfront'),
    monthly: t('transactions.limitConsumptionTypes.monthly'),
  }));

  function syncEndsOnFromInstallments() {
    if (form.recurrenceType !== 'installment' || !form.startsOn || form.installmentsCount == null || form.installmentsCount < 1) {
      return;
    }

    form.endsOn = addMonthsToIsoDate(form.startsOn, form.installmentsCount - 1);
    errors.value.endsOn = [];
  }

  async function loadCategories() {
    try {
      const result = await listCategories({
        perPage: 100,
        sort: 'name asc',
        filters: { activeEq: true },
      });

      categoryItems.value = result.categories.map((category) => ({
        key: category.id,
        label: category.name,
        color: category.color,
      }));
    } catch {
      categoryItems.value = [];
    }
  }

  async function loadAccounts() {
    try {
      const result = await listAccounts({
        perPage: 100,
        sort: 'name asc',
        filters: { activeEq: true },
      });

      accountItems.value = result.accounts.map((account) => ({
        key: account.id,
        label: account.name,
        color: account.color,
      }));
    } catch {
      accountItems.value = [];
    }
  }

  async function loadCreditCards() {
    try {
      const result = await listCreditCards({
        perPage: 100,
        sort: 'name asc',
        filters: { activeEq: true },
      });

      creditCardItems.value = result.creditCards.map((creditCard) => ({
        key: creditCard.id,
        label: creditCard.name,
        url: networkLogoUrl(creditCard.network),
      }));
    } catch {
      creditCardItems.value = [];
    }
  }

  async function loadTags() {
    try {
      const result = await listTags({
        perPage: 100,
        sort: 'name asc',
        filters: { activeEq: true },
      });

      tagItems.value = result.tags.map((tag) => ({
        key: tag.id,
        label: tag.name,
        color: tag.color,
      }));
    } catch {
      tagItems.value = [];
    }
  }

  function loadOptionLists() {
    return Promise.all([loadCategories(), loadAccounts(), loadCreditCards(), loadTags()]);
  }

  async function ensureCategoryOption(categoryId: string) {
    if (!categoryId || categoryItems.value.some((item) => item.key === categoryId)) return;

    try {
      const category = await getCategory(categoryId);
      categoryItems.value = addSortedOption(categoryItems.value, { key: category.id, label: category.name, color: category.color });
    } catch {
      categoryItems.value = addSortedOption(categoryItems.value, { key: categoryId, label: categoryId });
    }
  }

  async function ensureAccountOption(accountId: string) {
    if (!accountId || accountItems.value.some((item) => item.key === accountId)) return;

    try {
      const account = await getAccount(accountId);
      accountItems.value = addSortedOption(accountItems.value, { key: account.id, label: account.name, color: account.color });
    } catch {
      accountItems.value = addSortedOption(accountItems.value, { key: accountId, label: accountId });
    }
  }

  async function ensureCreditCardOption(creditCardId: string) {
    if (!creditCardId || creditCardItems.value.some((item) => item.key === creditCardId)) return;

    try {
      const creditCard = await getCreditCard(creditCardId);
      creditCardItems.value = addSortedOption(creditCardItems.value, {
        key: creditCard.id,
        label: creditCard.name,
        url: networkLogoUrl(creditCard.network),
      });
    } catch {
      creditCardItems.value = addSortedOption(creditCardItems.value, { key: creditCardId, label: creditCardId });
    }
  }

  async function ensureTagOption(tagId: string) {
    if (!tagId || tagItems.value.some((item) => item.key === tagId)) return;

    try {
      const tag = await getTag(tagId);
      tagItems.value = addSortedOption(tagItems.value, { key: tag.id, label: tag.name, color: tag.color });
    } catch {
      tagItems.value = addSortedOption(tagItems.value, { key: tagId, label: tagId });
    }
  }

  return {
    form,
    errors,
    applyCatch,
    createHandler,
    categoryItems,
    accountItems,
    creditCardItems,
    tagItems,
    isTransfer,
    isIncomeOrExpense,
    isCreditCardPayment,
    isAccountPayment,
    hasRecurrenceType,
    showInstallmentsCount,
    showEndsOn,
    showLimitConsumptionType,
    startsOnLabel,
    kindItems,
    paymentMethodItems,
    recurrenceTypeItems,
    limitConsumptionTypeItems,
    syncEndsOnFromInstallments,
    loadOptionLists,
    ensureCategoryOption,
    ensureAccountOption,
    ensureCreditCardOption,
    ensureTagOption,
  };
}
