<script setup lang="ts">
import type { TagGoal } from '@/types/tag';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { minGoalEndsOn } from '@/utils/tagGoal';
import Calendar from '@/components/inputs/Calendar.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';

const props = withDefaults(
  defineProps<{
    errors: {
      goalStartsOn: string[];
      goalValue: string[];
      goalEndsOn: string[];
    };
    i18nNamespace?: 'tags' | 'categories';
    startsRequired?: boolean;
    valueRequired?: boolean;
    startsDisabled?: boolean;
    valueDisabled?: boolean;
    goals?: Pick<TagGoal, 'month' | 'year'>[];
  }>(),
  {
    i18nNamespace: 'tags',
    startsRequired: false,
    valueRequired: false,
    startsDisabled: false,
    valueDisabled: false,
    goals: () => [],
  },
);

const goalStartsOn = defineModel<string | null>('goalStartsOn', { required: true });
const goalValue = defineModel<number | null>('goalValue', { required: true });
const goalEndsOn = defineModel<string | null>('goalEndsOn', { required: true });

const { t } = useI18n();
const endsOnMin = computed(() => minGoalEndsOn(props.goals));
</script>

<template>
  <div class="field">
    <Calendar
      v-model="goalStartsOn"
      name="goalStartsOn"
      precision="month"
      :label="t(`${props.i18nNamespace}.form.goalStartsOn`)"
      :required="startsRequired"
      :disabled="startsDisabled"
      :error="errors.goalStartsOn[0]"
    />
  </div>

  <div class="field">
    <InputNumeric
      v-model="goalValue"
      name="goalValue"
      :label="t(`${props.i18nNamespace}.form.goalValue`)"
      :required="valueRequired"
      :disabled="valueDisabled"
      :error="errors.goalValue[0]"
    >
      <template v-if="$slots['value-label-extra']" #label-extra>
        <slot name="value-label-extra" />
      </template>
      <template v-if="$slots['value-addon']" #addon>
        <slot name="value-addon" />
      </template>
    </InputNumeric>
  </div>

  <div class="field">
    <Calendar
      v-model="goalEndsOn"
      name="goalEndsOn"
      precision="month"
      :label="t(`${props.i18nNamespace}.form.goalEndsOn`)"
      :min="endsOnMin"
      :error="errors.goalEndsOn[0]"
    />
  </div>
</template>
