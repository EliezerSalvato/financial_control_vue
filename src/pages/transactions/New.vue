<script setup lang="ts">
import type {
  LimitConsumptionType,
  TransactionCreatePayload,
  TransactionForm,
  TransactionKind,
  TransactionPaymentMethod,
  TransactionRecurrenceType,
} from '@/types/transaction';
import { createTransaction } from '@/api/transactions';
import { useTransactionForm } from '@/composables/useTransactionForm';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import AccountSelect from '@/components/inputs/AccountSelect.vue';
import Calendar from '@/components/inputs/Calendar.vue';
import CategorySelect from '@/components/inputs/CategorySelect.vue';
import CreditCardSelect from '@/components/inputs/CreditCardSelect.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputNumber from '@/components/inputs/InputNumber.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Select from '@/components/inputs/Select.vue';
import TagSelect from '@/components/inputs/TagSelect.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

function kindFromRoute(): TransactionKind | '' {
  const value = route.query.kind;
  const kind = Array.isArray(value) ? value[0] : value;

  return kind === 'income' || kind === 'expense' || kind === 'transfer_between_accounts' ? kind : '';
}

const descriptionInput = useTemplateRef<{ focus: () => void }>('descriptionInput');
const loading = ref(false);

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
} = useTransactionForm({ kind: kindFromRoute() });

function validate(): boolean {
  const blankFields: (keyof TransactionForm)[] = ['description', 'kind', 'categoryId'];

  if (isIncomeOrExpense.value) {
    blankFields.push('paymentMethod', 'recurrenceType');
  }

  if (isTransfer.value) {
    blankFields.push('recurrenceType', 'sourceAccountId', 'destinationAccountId');
  } else if (isCreditCardPayment.value) {
    blankFields.push('creditCardId');

    if (showLimitConsumptionType.value) {
      blankFields.push('limitConsumptionType');
    }
  } else if (isAccountPayment.value) {
    blankFields.push('accountId');
  }

  if (hasRecurrenceType.value) {
    blankFields.push('startsOn', 'value');
  }

  if (showInstallmentsCount.value) {
    blankFields.push('installmentsCount');
  }

  const handler = createHandler().checkBlank(blankFields);

  if (isTransfer.value && form.sourceAccountId && form.destinationAccountId && form.sourceAccountId === form.destinationAccountId) {
    handler.add('destinationAccountId', t('transactions.errors.destinationAccountMustDiffer'));
  }

  if (showInstallmentsCount.value) {
    syncEndsOnFromInstallments();

    if (form.installmentsCount != null && form.installmentsCount <= 1) {
      handler.add('installmentsCount', t('transactions.errors.installmentsCountGreaterThanOne'));
    } else if (!form.endsOn) {
      handler.add('installmentsCount', t('utils.validators.blank'));
    }
  }

  if (showEndsOn.value && form.startsOn && form.endsOn && form.endsOn < form.startsOn) {
    handler.add('endsOn', t('transactions.errors.endsOnBeforeStartsOn'));
  }

  errors.value = handler.all;

  return handler.isValid;
}

function buildPayload(): TransactionCreatePayload {
  const kind = form.kind as TransactionKind;
  const recurrenceType = form.recurrenceType as TransactionRecurrenceType;
  const transaction: TransactionCreatePayload['transaction'] = {
    description: form.description,
    kind,
    recurrenceType,
    startsOn: form.startsOn as string,
    value: form.value ?? 0,
    categoryId: form.categoryId,
    tagIds: form.tagIds,
  };

  if (kind === 'transfer_between_accounts') {
    transaction.paymentMethod = null;
    transaction.sourceAccountId = form.sourceAccountId;
    transaction.destinationAccountId = form.destinationAccountId;
  } else {
    const paymentMethod = form.paymentMethod as TransactionPaymentMethod;
    transaction.paymentMethod = paymentMethod;

    if (paymentMethod === 'credit_card') {
      transaction.creditCardId = form.creditCardId;
      transaction.limitConsumptionType = showLimitConsumptionType.value ? (form.limitConsumptionType as LimitConsumptionType) : null;
    } else {
      transaction.accountId = form.accountId;
    }
  }

  if (recurrenceType === 'one_time') {
    transaction.endsOn = null;
  } else {
    transaction.endsOn = form.endsOn;
  }

  return { transaction };
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await createTransaction(buildPayload());

    await router.push({ name: 'transactions' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

function clearPaymentFields() {
  form.accountId = '';
  form.creditCardId = '';
  form.limitConsumptionType = '';
  form.sourceAccountId = '';
  form.destinationAccountId = '';
  errors.value.accountId = [];
  errors.value.creditCardId = [];
  errors.value.limitConsumptionType = [];
  errors.value.sourceAccountId = [];
  errors.value.destinationAccountId = [];
}

function clearRecurrenceFields() {
  form.recurrenceType = '';
  form.startsOn = null;
  form.endsOn = null;
  form.installmentsCount = null;
  form.value = null;
  errors.value.recurrenceType = [];
  errors.value.startsOn = [];
  errors.value.endsOn = [];
  errors.value.installmentsCount = [];
  errors.value.value = [];
}

watch(
  () => form.kind,
  () => {
    clearPaymentFields();
    clearRecurrenceFields();
    form.paymentMethod = '';
    errors.value.paymentMethod = [];
  },
);

watch(
  () => form.paymentMethod,
  () => {
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
    form.endsOn = null;
    form.installmentsCount = null;
    errors.value.endsOn = [];
    errors.value.installmentsCount = [];

    if (recurrenceType !== 'installment') {
      form.limitConsumptionType = '';
      errors.value.limitConsumptionType = [];
    }

    if (!recurrenceType) {
      form.startsOn = null;
      form.value = null;
      errors.value.startsOn = [];
      errors.value.value = [];
    }
  },
);

watch([() => form.startsOn, () => form.installmentsCount, () => form.recurrenceType], () => {
  if (form.recurrenceType === 'installment') {
    syncEndsOnFromInstallments();
  }
});

onMounted(() => {
  descriptionInput.value?.focus();
  void loadOptionLists();
});
</script>

<template>
  <FormPanel type="new" model-name="transaction" gender="female" :show-loading="loading" @call:save="save">
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
          :error="errors.kind[0]"
        />
      </div>

      <template v-if="isIncomeOrExpense">
        <div class="field">
          <Select
            v-model="form.paymentMethod"
            name="paymentMethod"
            :label="t('transactions.form.paymentMethod')"
            :placeholder="t('transactions.form.paymentMethodPlaceholder')"
            :items="paymentMethodItems"
            required
            :error="errors.paymentMethod[0]"
          />
        </div>
      </template>

      <template v-else-if="isTransfer">
        <div class="field">
          <AccountSelect
            v-model="form.sourceAccountId"
            v-model:items="accountItems"
            name="sourceAccountId"
            :label="t('transactions.form.sourceAccountId')"
            :placeholder="t('transactions.form.sourceAccountIdPlaceholder')"
            required
            :error="errors.sourceAccountId[0]"
          />
        </div>

        <div class="field">
          <AccountSelect
            v-model="form.destinationAccountId"
            v-model:items="accountItems"
            name="destinationAccountId"
            :label="t('transactions.form.destinationAccountId')"
            :placeholder="t('transactions.form.destinationAccountIdPlaceholder')"
            required
            :error="errors.destinationAccountId[0]"
          />
        </div>
      </template>

      <template v-if="isCreditCardPayment">
        <div class="field">
          <CreditCardSelect
            v-model="form.creditCardId"
            v-model:items="creditCardItems"
            name="creditCardId"
            :label="t('transactions.form.creditCardId')"
            :placeholder="t('transactions.form.creditCardIdPlaceholder')"
            required
            :error="errors.creditCardId[0]"
          />
        </div>
      </template>

      <div v-else-if="isAccountPayment" class="field">
        <AccountSelect
          v-model="form.accountId"
          v-model:items="accountItems"
          name="accountId"
          :label="t('transactions.form.accountId')"
          :placeholder="t('transactions.form.accountIdPlaceholder')"
          required
          :error="errors.accountId[0]"
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
          :error="errors.limitConsumptionType[0]"
        />
      </div>

      <template v-if="hasRecurrenceType">
        <div class="field">
          <Calendar v-model="form.startsOn" name="startsOn" :label="startsOnLabel" required :error="errors.startsOn[0]" />
        </div>

        <div v-if="showInstallmentsCount" class="field">
          <InputNumber
            v-model="form.installmentsCount"
            name="installmentsCount"
            :label="t('transactions.form.installmentsCount')"
            :min-value="1"
            :max-length="4"
            required
            :error="errors.installmentsCount[0]"
          />
        </div>

        <div v-if="showEndsOn" class="field">
          <Calendar v-model="form.endsOn" name="endsOn" :label="t('transactions.form.endsOn')" :error="errors.endsOn[0]" />
        </div>

        <div class="field">
          <InputNumeric v-model="form.value" name="value" :label="t('transactions.form.value')" required :error="errors.value[0]" />
        </div>
      </template>

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
</template>
