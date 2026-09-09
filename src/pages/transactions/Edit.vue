<script setup lang="ts">
import type {
  LimitConsumptionType,
  Transaction,
  TransactionForm,
  TransactionKind,
  TransactionPaymentMethod,
  TransactionRecurrence,
  TransactionRecurrenceCreateResult,
  TransactionRecurrenceType,
  TransactionStatus,
  TransactionUpdatePayload,
} from '@/types/transaction';
import { getTransaction, updateTransaction } from '@/api/transactions';
import { EXPENSE_PAYMENT_METHODS, INCOME_PAYMENT_METHODS, useTransactionForm } from '@/composables/useTransactionForm';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRoute, useRouter } from 'vue-router';
import { monthsBetweenInclusive } from '@/utils/isoDate';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import AccountSelect from '@/components/inputs/AccountSelect.vue';
import Calendar from '@/components/inputs/Calendar.vue';
import CategorySelect from '@/components/inputs/CategorySelect.vue';
import CreditCardSelect from '@/components/inputs/CreditCardSelect.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputNumber from '@/components/inputs/InputNumber.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import InputText from '@/components/inputs/InputText.vue';
import ModalChangeRecurrence from '@/pages/transactions/ModalChangeRecurrence.vue';
import ModalRecurrenceHistory from '@/pages/transactions/ModalRecurrenceHistory.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Select from '@/components/inputs/Select.vue';
import TagSelect from '@/components/inputs/TagSelect.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const descriptionInput = useTemplateRef<{ focus: () => void }>('descriptionInput');
const loading = ref(true);
const changeRecurrenceOpen = ref(false);
const recurrenceHistoryOpen = ref(false);
const recurrences = ref<TransactionRecurrence[]>([]);
const status = ref<TransactionStatus | ''>('');
const hydrating = ref(true);

const {
  form,
  errors,
  applyCatch,
  createHandler,
  categoryItems,
  accountItems,
  creditCardItems,
  tagItems,
  isTransfer,
  isCreditCardPayment,
  isAccountPayment,
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
} = useTransactionForm();

const canEditPaymentTarget = computed(() => status.value !== 'completed' && status.value !== 'canceled');
const canEditScheduleAndValue = computed(() => status.value === 'pending' || status.value === '');
const isUpfrontLimitConsumption = computed(() => showLimitConsumptionType.value && form.limitConsumptionType === 'upfront');
const canEditValue = computed(() => canEditScheduleAndValue.value && !isUpfrontLimitConsumption.value);
const canChangeRecurrence = computed(
  () =>
    status.value === 'active' && (form.recurrenceType === 'installment' || form.recurrenceType === 'recurring') && !isUpfrontLimitConsumption.value,
);
const hasMultipleRecurrences = computed(() => recurrences.value.length > 1);

const statusLabel = computed(() => (status.value ? t(`transactions.statuses.${status.value}`) : ''));

const statusTagClass = computed(() => {
  switch (status.value) {
    case 'pending':
      return 'is-warning';
    case 'active':
      return 'is-info';
    case 'completed':
      return 'is-success';
    case 'canceled':
      return 'is-danger';
    default:
      return '';
  }
});

function validate(): boolean {
  const blankFields: (keyof TransactionForm)[] = ['description', 'categoryId'];

  if (canEditScheduleAndValue.value) {
    blankFields.push('kind', 'recurrenceType', 'startsOn');

    if (canEditValue.value) {
      blankFields.push('value');
    }

    if (!isTransfer.value) {
      blankFields.push('paymentMethod');
    }

    if (showInstallmentsCount.value) {
      blankFields.push('installmentsCount');
    }
  }

  if (canEditPaymentTarget.value) {
    if (isTransfer.value) {
      blankFields.push('sourceAccountId', 'destinationAccountId');
    } else if (isCreditCardPayment.value) {
      blankFields.push('creditCardId');

      if (canEditScheduleAndValue.value && showLimitConsumptionType.value) {
        blankFields.push('limitConsumptionType');
      }
    } else if (isAccountPayment.value) {
      blankFields.push('accountId');
    }
  }

  const handler = createHandler().checkBlank(blankFields);

  if (
    canEditPaymentTarget.value &&
    isTransfer.value &&
    form.sourceAccountId &&
    form.destinationAccountId &&
    form.sourceAccountId === form.destinationAccountId
  ) {
    handler.add('destinationAccountId', t('transactions.errors.destinationAccountMustDiffer'));
  }

  if (canEditScheduleAndValue.value && showInstallmentsCount.value) {
    syncEndsOnFromInstallments();

    if (form.installmentsCount != null && form.installmentsCount <= 1) {
      handler.add('installmentsCount', t('transactions.errors.installmentsCountGreaterThanOne'));
    } else if (!form.endsOn) {
      handler.add('installmentsCount', t('utils.validators.blank'));
    }
  }

  if (showEndsOn.value && canEditPaymentTarget.value && form.startsOn && form.endsOn && form.endsOn < form.startsOn) {
    handler.add('endsOn', t('transactions.errors.endsOnBeforeStartsOn'));
  }

  errors.value = handler.all;

  return handler.isValid;
}

function buildPayload(): TransactionUpdatePayload {
  const transaction: TransactionUpdatePayload['transaction'] = {
    description: form.description,
    categoryId: form.categoryId,
    tagIds: form.tagIds,
  };

  if (!canEditPaymentTarget.value) {
    return { transaction };
  }

  if (canEditScheduleAndValue.value) {
    transaction.endsOn = form.recurrenceType === 'one_time' ? null : form.endsOn;
  } else if (status.value === 'active' && form.recurrenceType === 'recurring') {
    transaction.endsOn = form.endsOn;
  }

  if (isTransfer.value) {
    transaction.sourceAccountId = form.sourceAccountId;
    transaction.destinationAccountId = form.destinationAccountId;
  } else if (isCreditCardPayment.value) {
    transaction.creditCardId = form.creditCardId;

    if (canEditScheduleAndValue.value) {
      transaction.limitConsumptionType = showLimitConsumptionType.value ? (form.limitConsumptionType as LimitConsumptionType) : null;
    }
  } else if (isAccountPayment.value) {
    transaction.accountId = form.accountId;
  }

  if (canEditScheduleAndValue.value) {
    transaction.kind = form.kind as TransactionKind;
    transaction.recurrenceType = form.recurrenceType as TransactionRecurrenceType;
    transaction.startsOn = form.startsOn as string;

    if (canEditValue.value) {
      transaction.value = form.value ?? 0;
    }

    if (isTransfer.value) {
      transaction.paymentMethod = null;
      transaction.accountId = null;
      transaction.creditCardId = null;
      transaction.limitConsumptionType = null;
    } else {
      transaction.paymentMethod = form.paymentMethod as TransactionPaymentMethod;
      transaction.sourceAccountId = null;
      transaction.destinationAccountId = null;

      if (isCreditCardPayment.value) {
        transaction.accountId = null;
      } else if (isAccountPayment.value) {
        transaction.creditCardId = null;
        transaction.limitConsumptionType = null;
      }
    }
  }

  return { transaction };
}

function oldestStartsOn(transaction: Transaction): string | null {
  return transaction.recurrences.reduce<string | null>((oldest, recurrence) => {
    if (!oldest || recurrence.startsOn < oldest) return recurrence.startsOn;

    return oldest;
  }, transaction.startsOn);
}

function applyTransaction(transaction: Transaction) {
  recurrences.value = [...transaction.recurrences];
  status.value = transaction.status;
  form.description = transaction.description;
  form.kind = transaction.kind;
  form.paymentMethod = transaction.paymentMethod ?? '';
  form.recurrenceType = transaction.recurrenceType;
  form.startsOn = oldestStartsOn(transaction);
  form.endsOn = transaction.endsOn;
  form.installmentsCount =
    transaction.recurrenceType === 'installment' && form.startsOn && transaction.endsOn
      ? (monthsBetweenInclusive(form.startsOn, transaction.endsOn) ?? transaction.installmentsCount)
      : transaction.installmentsCount;
  form.value = transaction.currentValue;
  form.categoryId = transaction.categoryId ?? '';
  form.accountId = transaction.accountId ?? '';
  form.creditCardId = transaction.creditCardId ?? '';
  form.limitConsumptionType = transaction.limitConsumptionType ?? '';
  form.sourceAccountId = transaction.sourceAccountId ?? '';
  form.destinationAccountId = transaction.destinationAccountId ?? '';
  form.tagIds = transaction.tagIds;
}

async function loadTransaction() {
  const id = String(route.params.id);

  hydrating.value = true;

  try {
    const result = await getTransaction(id);

    applyTransaction(result);

    await Promise.all([
      result.categoryId ? ensureCategoryOption(result.categoryId) : Promise.resolve(),
      result.accountId ? ensureAccountOption(result.accountId) : Promise.resolve(),
      result.creditCardId ? ensureCreditCardOption(result.creditCardId) : Promise.resolve(),
      result.sourceAccountId ? ensureAccountOption(result.sourceAccountId) : Promise.resolve(),
      result.destinationAccountId ? ensureAccountOption(result.destinationAccountId) : Promise.resolve(),
      ...result.tagIds.map((tagId) => ensureTagOption(tagId)),
    ]);
  } catch (error) {
    applyCatch(error);
  } finally {
    hydrating.value = false;
  }
}

function onRecurrenceSaved(result: TransactionRecurrenceCreateResult) {
  hydrating.value = true;
  applyTransaction(result.transaction);
  hydrating.value = false;
  notificationStore.setCurrentMessage(result.message, 'success');
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await updateTransaction(String(route.params.id), buildPayload());

    await router.push({ name: 'transactions' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => form.kind,
  (kind) => {
    if (hydrating.value) return;

    if (kind === 'transfer_between_accounts') {
      form.paymentMethod = '';
      form.accountId = '';
      form.creditCardId = '';
      form.limitConsumptionType = '';
      errors.value.paymentMethod = [];
      errors.value.accountId = [];
      errors.value.creditCardId = [];
      errors.value.limitConsumptionType = [];
      return;
    }

    form.sourceAccountId = '';
    form.destinationAccountId = '';
    errors.value.sourceAccountId = [];
    errors.value.destinationAccountId = [];

    const methods = kind === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS;

    if (!methods.includes(form.paymentMethod as TransactionPaymentMethod)) {
      form.paymentMethod = '';
      form.accountId = '';
      form.creditCardId = '';
      form.limitConsumptionType = '';
      errors.value.paymentMethod = [];
      errors.value.accountId = [];
      errors.value.creditCardId = [];
      errors.value.limitConsumptionType = [];
    }
  },
);

watch(
  () => form.paymentMethod,
  () => {
    if (hydrating.value) return;

    form.accountId = '';
    form.creditCardId = '';
    form.limitConsumptionType = '';
    errors.value.accountId = [];
    errors.value.creditCardId = [];
    errors.value.limitConsumptionType = [];
  },
);

watch(
  () => form.recurrenceType,
  (recurrenceType) => {
    if (hydrating.value) return;

    form.endsOn = null;
    form.installmentsCount = null;
    errors.value.endsOn = [];
    errors.value.installmentsCount = [];

    if (recurrenceType !== 'installment') {
      form.limitConsumptionType = '';
      errors.value.limitConsumptionType = [];
    }
  },
);

watch([() => form.startsOn, () => form.installmentsCount, () => form.recurrenceType], () => {
  if (hydrating.value) return;

  if (form.recurrenceType === 'installment') {
    syncEndsOnFromInstallments();
  }
});

onMounted(async () => {
  try {
    await loadOptionLists();
    await loadTransaction();
  } finally {
    loading.value = false;
  }

  await nextTick();
  descriptionInput.value?.focus();
});
</script>

<template>
  <FormPanel type="edit" model-name="transaction" gender="female" :show-loading="loading" @call:save="save">
    <template #heading>
      <span v-if="status" class="tag is-light has-text-weight-bold" :class="statusTagClass">{{ statusLabel }}</span>
    </template>

    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText
        ref="descriptionInput"
        v-model="form.description"
        name="description"
        :label="t('transactions.form.description')"
        required
        :errors="errors.description"
      />

      <div class="field">
        <Select
          v-model="form.kind"
          name="kind"
          :label="t('transactions.form.kind')"
          :placeholder="t('transactions.form.kindPlaceholder')"
          :items="kindItems"
          required
          :disabled="!canEditScheduleAndValue"
          :error="errors.kind[0]"
        />
      </div>

      <div v-if="!isTransfer" class="field">
        <Select
          v-model="form.paymentMethod"
          name="paymentMethod"
          :label="t('transactions.form.paymentMethod')"
          :placeholder="t('transactions.form.paymentMethodPlaceholder')"
          :items="paymentMethodItems"
          required
          :disabled="!canEditScheduleAndValue"
          :error="errors.paymentMethod[0]"
        />
      </div>

      <div class="field">
        <Select
          v-model="form.recurrenceType"
          name="recurrenceType"
          :label="t('transactions.form.recurrenceType')"
          :placeholder="t('transactions.form.recurrenceTypePlaceholder')"
          :items="recurrenceTypeItems"
          required
          :disabled="!canEditScheduleAndValue"
          :error="errors.recurrenceType[0]"
        />
      </div>

      <div v-if="showLimitConsumptionType" class="field">
        <Select
          v-model="form.limitConsumptionType"
          name="limitConsumptionType"
          :label="t('transactions.form.limitConsumptionType')"
          :placeholder="t('transactions.form.limitConsumptionTypePlaceholder')"
          :items="limitConsumptionTypeItems"
          required
          :disabled="!canEditScheduleAndValue"
          :error="errors.limitConsumptionType[0]"
        />
      </div>

      <template v-if="isTransfer">
        <AccountSelect
          v-model="form.sourceAccountId"
          v-model:items="accountItems"
          name="sourceAccountId"
          :label="t('transactions.form.sourceAccountId')"
          :placeholder="t('transactions.form.sourceAccountIdPlaceholder')"
          required
          :disabled="!canEditPaymentTarget"
          :error="errors.sourceAccountId[0]"
        />

        <AccountSelect
          v-model="form.destinationAccountId"
          v-model:items="accountItems"
          name="destinationAccountId"
          :label="t('transactions.form.destinationAccountId')"
          :placeholder="t('transactions.form.destinationAccountIdPlaceholder')"
          required
          :disabled="!canEditPaymentTarget"
          :error="errors.destinationAccountId[0]"
        />
      </template>

      <template v-else-if="isCreditCardPayment">
        <CreditCardSelect
          v-model="form.creditCardId"
          v-model:items="creditCardItems"
          name="creditCardId"
          :label="t('transactions.form.creditCardId')"
          :placeholder="t('transactions.form.creditCardIdPlaceholder')"
          required
          :disabled="!canEditPaymentTarget"
          :error="errors.creditCardId[0]"
        />
      </template>

      <template v-else-if="isAccountPayment">
        <AccountSelect
          v-model="form.accountId"
          v-model:items="accountItems"
          name="accountId"
          :label="t('transactions.form.accountId')"
          :placeholder="t('transactions.form.accountIdPlaceholder')"
          required
          :disabled="!canEditPaymentTarget"
          :error="errors.accountId[0]"
        />
      </template>

      <div class="field">
        <Calendar
          v-model="form.startsOn"
          name="startsOn"
          :label="startsOnLabel"
          required
          :disabled="!canEditScheduleAndValue"
          :error="errors.startsOn[0]"
        />
      </div>

      <div v-if="showInstallmentsCount" class="field">
        <InputNumber
          v-model="form.installmentsCount"
          name="installmentsCount"
          :label="t('transactions.form.installmentsCount')"
          :min-value="1"
          :max-length="4"
          required
          :disabled="!canEditScheduleAndValue"
          :error="errors.installmentsCount[0]"
        />
      </div>

      <div v-if="showEndsOn" class="field">
        <Calendar
          v-model="form.endsOn"
          name="endsOn"
          :label="t('transactions.form.endsOn')"
          :disabled="!canEditPaymentTarget"
          :error="errors.endsOn[0]"
        />
      </div>

      <div class="field">
        <InputNumeric
          v-model="form.value"
          name="value"
          :label="t('transactions.form.value')"
          required
          :disabled="!canEditValue"
          :error="errors.value[0]"
        >
          <template v-if="hasMultipleRecurrences" #label-extra>
            <button type="button" class="button is-small" @click.stop="recurrenceHistoryOpen = true">
              {{ t('transactions.form.showChangeHistory') }}
            </button>
          </template>
          <template v-if="canChangeRecurrence" #addon>
            <button type="button" class="button is-link" @click="changeRecurrenceOpen = true">
              {{ t('transactions.form.change') }}
            </button>
          </template>
        </InputNumeric>
      </div>

      <CategorySelect
        v-model="form.categoryId"
        v-model:items="categoryItems"
        name="categoryId"
        :label="t('transactions.form.categoryId')"
        :placeholder="t('transactions.form.categoryIdPlaceholder')"
        required
        :error="errors.categoryId[0]"
      />

      <TagSelect
        v-model="form.tagIds"
        v-model:items="tagItems"
        name="tagIds"
        :label="t('transactions.form.tagIds')"
        :placeholder="t('transactions.form.tagIdsPlaceholder')"
        :error="errors.tagIds[0]"
      />
    </template>
  </FormPanel>

  <ModalChangeRecurrence
    v-model:open="changeRecurrenceOpen"
    :transaction-id="String(route.params.id)"
    :initial-value="form.value"
    :initial-starts-on="form.startsOn"
    :ends-on="form.endsOn"
    :recurrences="recurrences"
    @saved="onRecurrenceSaved"
  />

  <ModalRecurrenceHistory v-model:open="recurrenceHistoryOpen" :recurrences="recurrences" />
</template>
