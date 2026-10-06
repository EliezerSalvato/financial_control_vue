<script setup lang="ts">
import type { ImportRuleEffectForm, ImportRuleEffectType, ImportRuleForm, ImportRuleMatchType, ImportRuleTargetColumn } from '@/types/import_rule';
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { FormErrors } from '@/utils/errorsHandler';
import { emptyImportRuleEffect, groupImportRuleEffectErrors, IMPORT_RULE_EFFECT_TYPES, importRuleEffectHasField, isBlank } from '@/utils/importRule';
import { listCategories } from '@/api/categories';
import { listTags } from '@/api/tags';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import CategorySelect from '@/components/inputs/CategorySelect.vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import InputNumber from '@/components/inputs/InputNumber.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';
import TagSelect from '@/components/inputs/TagSelect.vue';

const form = defineModel<ImportRuleForm>({ required: true });

const props = defineProps<{
  errors: FormErrors<ImportRuleForm>;
}>();

const { t } = useI18n();

const matchTypeItems = computed(() => ({
  contains: t('importRules.matchTypes.contains'),
  regex: t('importRules.matchTypes.regex'),
}));

// CSV column names are shown as-is, never translated.
const targetColumnItems = { both: 'title + description', title: 'title', description: 'description' };

const effectTypeItems = computed(() => Object.fromEntries(IMPORT_RULE_EFFECT_TYPES.map((type) => [type, t(`importRules.effectTypes.${type}`)])));

const recurrenceTypeItems = computed(() => ({
  one_time: t('transactions.recurrenceTypes.oneTime'),
  installment: t('transactions.recurrenceTypes.installment'),
  recurring: t('transactions.recurrenceTypes.recurring'),
}));

const effectErrors = computed(() => groupImportRuleEffectErrors(props.errors.effects));

function effectFieldHasError(index: number, field: string): boolean {
  return effectErrors.value.byEffect[index]?.includes(field) ?? false;
}

function effectError(index: number, field: string): string | undefined {
  return effectFieldHasError(index, field) ? t('importRules.errors.invalidField') : undefined;
}

function effectFieldErrors(index: number, field: string): string[] {
  return effectFieldHasError(index, field) ? [t('importRules.errors.invalidField')] : [];
}

const categoryItems = ref<ColorOption[]>([]);
const tagItems = ref<ColorOption[]>([]);

async function loadOptionLists() {
  const [categories, tags] = await Promise.allSettled([
    listCategories({ perPage: 100, sort: 'name asc' }),
    listTags({ perPage: 100, sort: 'name asc' }),
  ]);

  if (categories.status === 'fulfilled') {
    categoryItems.value = categories.value.categories.map((category) => ({ key: category.id, label: category.name, color: category.color }));
  }

  if (tags.status === 'fulfilled') {
    tagItems.value = tags.value.tags.map((tag) => ({ key: tag.id, label: tag.name, color: tag.color }));
  }
}

onMounted(loadOptionLists);

function addEffect() {
  form.value.effects.push(emptyImportRuleEffect());
}

function removeEffect(index: number) {
  form.value.effects.splice(index, 1);
}

function moveEffect(index: number, direction: -1 | 1) {
  const target = index + direction;

  if (target < 0 || target >= form.value.effects.length) return;

  form.value.effects.splice(target, 0, ...form.value.effects.splice(index, 1));
}
</script>

<template>
  <InputText v-model="form.name" name="name" :label="t('importRules.form.name')" required :errors="errors.name" />

  <div class="columns">
    <div class="column">
      <Select
        v-model="form.matchType"
        name="matchType"
        :label="t('importRules.form.matchType')"
        :items="matchTypeItems"
        @change:selected="({ value }) => (form.matchType = (value || 'contains') as ImportRuleMatchType)"
      />
    </div>
    <div class="column">
      <Select
        v-model="form.targetColumn"
        name="targetColumn"
        :label="t('importRules.form.targetColumn')"
        :items="targetColumnItems"
        @change:selected="({ value }) => (form.targetColumn = (value || 'both') as ImportRuleTargetColumn)"
      />
    </div>
  </div>

  <InputText
    v-model="form.pattern"
    name="pattern"
    :label="t('importRules.form.pattern')"
    :placeholder="t(`importRules.patternPlaceholder.${form.matchType}`)"
    required
    :errors="errors.pattern"
  />

  <div class="field">
    <label class="label" for="position">{{ t('importRules.form.position') }}</label>
    <input id="position" v-model.number="form.position" type="number" min="0" step="1" class="input is-primary" />
    <p class="help is-danger">{{ errors.position[0] }}</p>
  </div>

  <div class="field">
    <div class="control">
      <CheckBox v-model="form.caseSensitive" name="caseSensitive" :label="t('importRules.form.caseSensitive')" />
    </div>
  </div>

  <div class="field">
    <div class="control">
      <CheckBox v-model="form.active" name="active" :label="t('importRules.form.active')" />
    </div>
  </div>

  <h3 class="label">{{ t('importRules.form.effects') }}</h3>
  <p class="help is-danger effects-error">{{ effectErrors.general[0] }}</p>

  <div v-for="(effect, index) in form.effects" :key="index" class="box effect">
    <div class="effect-header">
      <Select
        v-model="effect.effectType"
        :name="`effectType-${index}`"
        :error="effectError(index, 'effectType')"
        :placeholder="t('importRules.form.effectTypePlaceholder')"
        :items="effectTypeItems"
        class="effect-type"
        @change:selected="({ value }) => (effect.effectType = (value || '') as ImportRuleEffectType | '')"
      />
      <div class="buttons has-addons">
        <button type="button" class="button" :disabled="index === 0" @click="moveEffect(index, -1)">
          <i class="fas fa-arrow-up" aria-hidden="true"></i>
        </button>
        <button type="button" class="button" :disabled="index === form.effects.length - 1" @click="moveEffect(index, 1)">
          <i class="fas fa-arrow-down" aria-hidden="true"></i>
        </button>
        <button type="button" class="button is-danger is-light" @click="removeEffect(index)">
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <CategorySelect
      v-if="importRuleEffectHasField(effect, 'categoryId')"
      v-model="effect.categoryId"
      v-model:items="categoryItems"
      :name="`categoryId-${index}`"
      :error="effectError(index, 'categoryId')"
      :label="t('importRules.form.categoryId')"
      :placeholder="t('importRules.form.categoryIdPlaceholder')"
    />
    <TagSelect
      v-if="importRuleEffectHasField(effect, 'tagIds')"
      v-model="effect.tagIds"
      v-model:items="tagItems"
      :name="`tagIds-${index}`"
      :error="effectError(index, 'tagIds')"
      :label="t('importRules.form.tagIds')"
      :placeholder="t('importRules.form.tagIdsPlaceholder')"
    />
    <Select
      v-if="importRuleEffectHasField(effect, 'recurrenceType')"
      v-model="effect.recurrenceType"
      :name="`recurrenceType-${index}`"
      :error="effectError(index, 'recurrenceType')"
      :label="t('importRules.form.recurrenceType')"
      :items="recurrenceTypeItems"
      @change:selected="({ value }) => (effect.recurrenceType = (value || '') as ImportRuleEffectForm['recurrenceType'])"
    />
    <InputNumber
      v-if="importRuleEffectHasField(effect, 'installmentsCount')"
      v-model="effect.installmentsCount"
      :name="`installmentsCount-${index}`"
      :error="effectError(index, 'installmentsCount')"
      :label="t('importRules.form.installmentsCount')"
      :min-value="2"
      :max-length="4"
      :disabled="effect.effectType === 'set_installments_count' && !isBlank(effect.pattern)"
    />
    <Select
      v-if="importRuleEffectHasField(effect, 'matchType')"
      v-model="effect.matchType"
      :name="`effectMatchType-${index}`"
      :error="effectError(index, 'matchType')"
      :label="t('importRules.form.effectMatchType')"
      :items="matchTypeItems"
      @change:selected="({ value }) => (effect.matchType = (value || 'contains') as ImportRuleMatchType)"
    />
    <InputText
      v-if="importRuleEffectHasField(effect, 'pattern')"
      v-model="effect.pattern"
      :name="`effectPattern-${index}`"
      :label="t(effect.effectType === 'replace_text' ? 'importRules.form.effectPattern' : 'importRules.form.installmentsPattern')"
      :disabled="effect.effectType === 'set_installments_count' && effect.installmentsCount != null"
      :placeholder="t(`importRules.patternPlaceholder.${effect.matchType}`)"
      :errors="effectFieldErrors(index, 'pattern')"
    />
    <Select
      v-if="importRuleEffectHasField(effect, 'targetColumn')"
      v-model="effect.targetColumn"
      :name="`effectTargetColumn-${index}`"
      :error="effectError(index, 'targetColumn')"
      :label="t('importRules.form.effectTargetColumn')"
      :items="targetColumnItems"
      @change:selected="({ value }) => (effect.targetColumn = (value || 'both') as ImportRuleTargetColumn)"
    />
    <InputText
      v-if="importRuleEffectHasField(effect, 'replacement')"
      v-model="effect.replacement"
      :name="`replacement-${index}`"
      :label="t('importRules.form.replacement')"
      :errors="effectFieldErrors(index, 'replacement')"
    />
  </div>

  <button type="button" class="button add-effect" @click="addEffect">
    <i class="fas fa-plus" aria-hidden="true"></i>
    <span>{{ t('importRules.addEffect') }}</span>
  </button>
</template>

<style scoped>
.effects-error {
  margin-bottom: 0.5rem;
}

.effect-header {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.effect-type {
  flex: 1;
}

.effect-header .buttons {
  flex-wrap: nowrap;
  margin-bottom: 0;
}

.add-effect span {
  margin-left: 5px;
}
</style>
