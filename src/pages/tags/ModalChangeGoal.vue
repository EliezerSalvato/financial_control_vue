<script setup lang="ts">
import type { TagGoal, TagGoalForm, TagGoalUpdateResult } from '@/types/tag';
import { updateTagGoal } from '@/api/tags';
import { useAppLocale } from '@/composables/useAppLocale';
import { useFormErrors } from '@/composables/useFormErrors';
import { useI18n } from 'vue-i18n';
import { defaultTagGoalStartsOn, previousTagGoalValue } from '@/utils/tagGoal';
import { monthStartFromIso, yearMonthTotal } from '@/utils/isoDate';
import { reactive, ref, watch } from 'vue';
import Calendar from '@/components/inputs/Calendar.vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import Modal from '@/components/Modal.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const props = withDefaults(
  defineProps<{
    tagId: string;
    open?: boolean;
    initialValue?: number | null;
    endsOn?: string | null;
    goals?: TagGoal[];
  }>(),
  {
    open: false,
    initialValue: null,
    endsOn: null,
    goals: () => [],
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  saved: [result: TagGoalUpdateResult];
}>();

const { t } = useI18n();
const { appLocale } = useAppLocale();
const saving = ref(false);

const form = reactive<TagGoalForm>({
  value: null,
  startsOn: null,
  changeForNextMonths: false,
});

const { errors, applyCatch, createHandler, resetErrors } = useFormErrors(form);

function resetForm() {
  form.value = props.initialValue;
  form.startsOn = defaultTagGoalStartsOn(props.goals, appLocale.value);
  form.changeForNextMonths = false;
  resetErrors();
}

function close() {
  emit('update:open', false);
}

function validate(): boolean {
  const handler = createHandler().checkBlank(['value', 'startsOn']);
  const startsOn = form.startsOn ? (monthStartFromIso(form.startsOn) ?? form.startsOn) : null;

  if (startsOn && props.endsOn) {
    const endsOn = monthStartFromIso(props.endsOn) ?? props.endsOn;
    const startsTotal = yearMonthTotal(startsOn);
    const endsTotal = yearMonthTotal(endsOn);

    if (startsTotal != null && endsTotal != null && startsTotal > endsTotal) {
      handler.add('startsOn', t('tags.errors.startsOnAfterEndsOn'));
    }
  }

  if (form.value != null) {
    const previousValue = startsOn ? previousTagGoalValue(props.goals, startsOn, props.initialValue) : props.initialValue;

    if (previousValue != null && form.value === previousValue) {
      handler.add('value', t('tags.errors.valueMustDifferFromPreviousGoal'));
    }
  }

  errors.value = handler.all;

  return handler.isValid;
}

async function save() {
  if (saving.value || !validate()) return;

  saving.value = true;

  try {
    const result = await updateTagGoal(props.tagId, {
      tagGoal: {
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
  <Modal :title="t('tags.changeGoal.title')" :open-modal="open" @close="close">
    <template #body>
      <form id="change-tag-goal-form" @submit.prevent="save">
        <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
          <p v-for="error in errors.base" :key="error">{{ error }}</p>
        </NotificationMessage>

        <InputNumeric v-model="form.value" name="value" :label="t('tags.changeGoal.value')" required :error="errors.value[0]" />

        <div class="field">
          <Calendar
            v-model="form.startsOn"
            name="startsOn"
            precision="month"
            :label="t('tags.changeGoal.startsOn')"
            required
            :error="errors.startsOn[0]"
          />
        </div>

        <div class="field">
          <div class="control">
            <CheckBox v-model="form.changeForNextMonths" name="changeForNextMonths" :label="t('tags.changeGoal.changeForNextMonths')" />
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <button type="submit" form="change-tag-goal-form" class="button is-link" :class="{ 'is-loading': saving }" :disabled="saving">
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
