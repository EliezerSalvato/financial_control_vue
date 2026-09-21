<script setup lang="ts">
import type { Tag, TagForm, TagGoal, TagGoalUpdateResult } from '@/types/tag';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { getTag, updateTag } from '@/api/tags';
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { currentTagGoalValue, firstTagGoalStartsOn, goalEndsOnConflictsWithExistingGoals, tagGoalWriteFields, wantsTagGoal } from '@/utils/tagGoal';
import CheckBox from '@/components/inputs/CheckBox.vue';
import ColorPicker from '@/components/inputs/ColorPicker.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import ModalChangeGoal from '@/pages/tags/ModalChangeGoal.vue';
import ModalGoalHistory from '@/pages/tags/ModalGoalHistory.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import TagGoalFields from '@/pages/tags/TagGoalFields.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(true);
const changeGoalOpen = ref(false);
const goalHistoryOpen = ref(false);
const goals = ref<TagGoal[]>([]);
const currentGoalValue = ref<number | null>(null);

const form = reactive<TagForm>({
  name: '',
  color: '',
  active: true,
  goalStartsOn: null,
  goalValue: null,
  goalEndsOn: null,
});

const { errors, applyCatch, createHandler } = useFormErrors(form);

const hasGoal = computed(() => goals.value.length > 0);
const hasMultipleGoals = computed(() => goals.value.length > 1);

function applyTag(tag: Tag) {
  goals.value = [...tag.goals];
  currentGoalValue.value = currentTagGoalValue(tag);
  form.name = tag.name;
  form.color = tag.color;
  form.active = tag.active;
  form.goalStartsOn = firstTagGoalStartsOn(tag.goals);
  form.goalValue = currentGoalValue.value;
  form.goalEndsOn = tag.goalEndsOn;
}

function validate(): boolean {
  const handler = createHandler().checkBlank(['name', 'color']);

  if (!hasGoal.value && wantsTagGoal(form)) {
    handler.checkBlank(['goalStartsOn', 'goalValue']);
  }

  if (form.goalStartsOn && form.goalEndsOn && form.goalEndsOn < form.goalStartsOn) {
    handler.add('goalEndsOn', t('tags.errors.endsOnBeforeStartsOn'));
  }

  if (goalEndsOnConflictsWithExistingGoals(form.goalEndsOn, goals.value)) {
    handler.add('goalEndsOn', t('tags.errors.endsOnExistingGoalMonth'));
  }

  errors.value = handler.all;

  return handler.isValid;
}

async function loadTag() {
  const id = String(route.params.id);

  loading.value = true;

  try {
    applyTag(await getTag(id));
    nameInput.value?.focus();
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

function onGoalSaved(result: TagGoalUpdateResult) {
  applyTag(result.tag);
  notificationStore.setCurrentMessage(result.message, 'success');
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await updateTag(String(route.params.id), {
      tag: {
        name: form.name,
        color: form.color,
        active: form.active,
        ...(hasGoal.value ? tagGoalWriteFields({ goalStartsOn: null, goalValue: null, goalEndsOn: form.goalEndsOn }) : tagGoalWriteFields(form)),
      },
    });

    await router.push({ name: 'tags' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadTag();
});
</script>

<template>
  <FormPanel type="edit" model-name="tag" gender="female" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText ref="nameInput" v-model="form.name" name="name" :label="t('tags.form.name')" required :errors="errors.name" />

      <TagGoalFields
        v-model:goal-starts-on="form.goalStartsOn"
        v-model:goal-value="form.goalValue"
        v-model:goal-ends-on="form.goalEndsOn"
        :errors="errors"
        :starts-required="!hasGoal && wantsTagGoal(form)"
        :value-required="!hasGoal && wantsTagGoal(form)"
        :starts-disabled="hasGoal"
        :value-disabled="hasGoal"
        :goals="goals"
      >
        <template v-if="hasMultipleGoals" #value-label-extra>
          <button type="button" class="button is-small" @click.stop="goalHistoryOpen = true">
            {{ t('tags.form.showChangeHistory') }}
          </button>
        </template>
        <template v-if="hasGoal" #value-addon>
          <button type="button" class="button is-link" @click="changeGoalOpen = true">
            {{ t('tags.form.change') }}
          </button>
        </template>
      </TagGoalFields>

      <ColorPicker v-model="form.color" name="color" :label="t('tags.form.color')" required :errors="errors.color" />

      <div class="field">
        <div class="control">
          <CheckBox v-model="form.active" name="active" :label="t('tags.form.active')" />
        </div>
      </div>
    </template>
  </FormPanel>

  <ModalChangeGoal
    v-model:open="changeGoalOpen"
    :tag-id="String(route.params.id)"
    :initial-value="currentGoalValue"
    :ends-on="form.goalEndsOn"
    :goals="goals"
    @saved="onGoalSaved"
  />

  <ModalGoalHistory v-model:open="goalHistoryOpen" :goals="goals" />
</template>
