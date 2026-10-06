<script setup lang="ts">
import type { ImportRuleForm } from '@/types/import_rule';
import { getImportRule, updateImportRule } from '@/api/import_rules';
import { useFormErrors } from '@/composables/useFormErrors';
import { useNotificationStore } from '@/stores/notification';
import { useRoute, useRouter } from 'vue-router';
import { applyImportRuleToForm, importRuleWritePayload, validateImportRuleEffects } from '@/utils/importRule';
import { onMounted, reactive, ref } from 'vue';
import FormPanel from '@/components/FormPanel.vue';
import ImportRuleFields from '@/pages/import_rules/ImportRuleFields.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(true);

const form = reactive<ImportRuleForm>({
  name: '',
  position: 0,
  active: true,
  matchType: 'contains',
  pattern: '',
  caseSensitive: false,
  targetColumn: 'both',
  effects: [],
});

const { errors, applyCatch, createHandler } = useFormErrors(form);

function validate(): boolean {
  const handler = createHandler().checkBlank(['name', 'pattern']);

  validateImportRuleEffects(form.effects).forEach((message) => handler.add('effects', message));

  errors.value = handler.all;

  return handler.isValid;
}

async function loadImportRule() {
  loading.value = true;

  try {
    applyImportRuleToForm(form, await getImportRule(String(route.params.id)));
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await updateImportRule(String(route.params.id), importRuleWritePayload(form));

    await router.push({ name: 'importRules' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadImportRule();
});
</script>

<template>
  <FormPanel type="edit" model-name="import_rule" gender="female" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <ImportRuleFields v-model="form" :errors="errors" />
    </template>
  </FormPanel>
</template>
