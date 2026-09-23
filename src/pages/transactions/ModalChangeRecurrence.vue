<script setup lang="ts">
import type { TransactionRecurrence, TransactionRecurrenceCreateResult, TransactionRecurrenceForm } from '@/types/transaction';
import { createTransactionRecurrence } from '@/api/transactions';
import { useAppLocale } from '@/composables/useAppLocale';
import { useFormErrors } from '@/composables/useFormErrors';
import { useI18n } from 'vue-i18n';
import { getZonedDateParts } from '@/locales/locale';
import { monthStartFromIso, parseIsoDate, toMonthStartIso, yearMonthTotal } from '@/utils/isoDate';
import { reactive, ref, watch } from 'vue';
import Calendar from '@/components/inputs/Calendar.vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import Modal from '@/components/Modal.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const props = withDefaults(
  defineProps<{
    transactionId: string;
    open?: boolean;
    initialValue?: number | null;
    initialStartsOn?: string | null;
    endsOn?: string | null;
    recurrences?: TransactionRecurrence[];
  }>(),
  {
    open: false,
    initialValue: null,
    initialStartsOn: null,
    endsOn: null,
    recurrences: () => [],
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  saved: [result: TransactionRecurrenceCreateResult];
}>();

const { t } = useI18n();
const { appLocale } = useAppLocale();
const saving = ref(false);

const form = reactive<TransactionRecurrenceForm>({
  value: null,
  startsOn: null,
  changeForNextMonths: false,
});

const { errors, applyCatch, createHandler, resetErrors } = useFormErrors(form);

function hasRecurrenceInMonth(year: number, month: number): boolean {
  return props.recurrences.some((recurrence) => {
    const parsed = parseIsoDate(recurrence.startsOn);

    return parsed !== null && parsed.year === year && parsed.month === month;
  });
}

function defaultStartsOn(startsOn: string | null): string | null {
  if (!startsOn) return null;

  const parsed = parseIsoDate(startsOn);

  if (!parsed) return monthStartFromIso(startsOn) ?? startsOn;

  const today = getZonedDateParts(new Date(), appLocale.value);
  const currentYear = today.year;
  const currentMonth = today.month;
  const currentTotal = currentYear * 12 + (today.month - 1);
  const startsOnTotal = parsed.year * 12 + (parsed.month - 1);

  if (currentTotal === startsOnTotal || hasRecurrenceInMonth(currentYear, currentMonth)) {
    const nextTotal = currentTotal + 1;
    const resultYear = Math.floor(nextTotal / 12);
    const resultMonth = (nextTotal % 12) + 1;

    return toMonthStartIso(resultYear, resultMonth);
  }

  if (currentTotal > startsOnTotal) {
    return toMonthStartIso(currentYear, currentMonth);
  }

  return toMonthStartIso(parsed.year, parsed.month);
}

function resetForm() {
  form.value = props.initialValue;
  form.startsOn = defaultStartsOn(props.initialStartsOn);
  form.changeForNextMonths = false;
  resetErrors();
}

function close() {
  emit('update:open', false);
}

function previousRecurrenceValue(startsOn: string): number | null {
  const startsOnTotal = yearMonthTotal(startsOn);

  if (startsOnTotal == null) return props.initialValue;

  let previous: TransactionRecurrence | null = null;
  let previousTotal = Number.NEGATIVE_INFINITY;

  for (const recurrence of props.recurrences) {
    const total = yearMonthTotal(recurrence.startsOn);

    if (total == null || total > startsOnTotal) continue;

    if (total >= previousTotal) {
      previous = recurrence;
      previousTotal = total;
    }
  }

  return previous?.value ?? props.initialValue;
}

function validate(): boolean {
  const handler = createHandler().checkBlank(['value', 'startsOn']);
  const startsOn = form.startsOn ? (monthStartFromIso(form.startsOn) ?? form.startsOn) : null;

  if (startsOn && props.endsOn) {
    const endsOn = monthStartFromIso(props.endsOn) ?? props.endsOn;
    const startsTotal = yearMonthTotal(startsOn);
    const endsTotal = yearMonthTotal(endsOn);

    if (startsTotal != null && endsTotal != null && startsTotal > endsTotal) {
      handler.add('startsOn', t('transactions.errors.startsOnAfterEndsOn'));
    }
  }

  if (form.value != null) {
    const previousValue = startsOn ? previousRecurrenceValue(startsOn) : props.initialValue;

    if (previousValue != null && form.value === previousValue) {
      handler.add('value', t('transactions.errors.valueMustDifferFromPreviousRecurrence'));
    }
  }

  errors.value = handler.all;

  return handler.isValid;
}

async function save() {
  if (saving.value || !validate()) return;

  saving.value = true;

  try {
    const result = await createTransactionRecurrence(props.transactionId, {
      transactionRecurrence: {
        value: form.value ?? 0,
        startsOn: monthStartFromIso(form.startsOn as string) ?? (form.startsOn as string),
        changeForNextMonths: form.changeForNextMonths,
      },
    });

    emit('saved', result);
    close();
  } catch (error) {
    applyCatch(error);
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm();
  },
);
</script>

<template>
  <Modal :title="t('transactions.changeRecurrence.title')" :open-modal="open" @close="close">
    <template #body>
      <form id="change-recurrence-form" @submit.prevent="save">
        <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
          <p v-for="error in errors.base" :key="error">{{ error }}</p>
        </NotificationMessage>

        <InputNumeric v-model="form.value" name="value" :label="t('transactions.changeRecurrence.value')" required :error="errors.value[0]" />

        <div class="field">
          <Calendar
            v-model="form.startsOn"
            name="startsOn"
            precision="month"
            :label="t('transactions.changeRecurrence.startsOn')"
            required
            :error="errors.startsOn[0]"
          />
        </div>

        <div class="field">
          <div class="control">
            <CheckBox v-model="form.changeForNextMonths" name="changeForNextMonths" :label="t('transactions.changeRecurrence.changeForNextMonths')" />
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <button type="submit" form="change-recurrence-form" class="button is-link" :class="{ 'is-loading': saving }" :disabled="saving">
        {{ t('buttons.save') }}
      </button>
      <button type="button" class="button" :disabled="saving" @click="close">{{ t('buttons.back') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.button + .button {
  margin-left: 7px;
}
</style>
