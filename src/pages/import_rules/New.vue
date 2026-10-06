<script setup lang="ts">
import type { ImportRuleForm } from '@/types/import_rule';
import { createImportRule, listImportRules } from '@/api/import_rules';
import { useFormErrors } from '@/composables/useFormErrors';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';
import { importRuleWritePayload, validateImportRuleEffects } from '@/utils/importRule';
import { onMounted, reactive, ref } from 'vue';
import FormPanel from '@/components/FormPanel.vue';
import ImportRuleFields from '@/pages/import_rules/ImportRuleFields.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(false);

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

async function loadNextPosition() {
  try {
    const result = await listImportRules({ page: 1, perPage: 1, sort: 'position desc' });
    const last = result.importRules[0];

    if (last) form.position = last.position + 1;
  } catch {
    // keeps the default position
  }
}

onMounted(loadNextPosition);

const { errors, applyCatch, createHandler } = useFormErrors(form);

function validate(): boolean {
  const handler = createHandler().checkBlank(['name', 'pattern']);

  validateImportRuleEffects(form.effects).forEach((message) => handler.add('effects', message));

  errors.value = handler.all;

  return handler.isValid;
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await createImportRule(importRuleWritePayload(form));

    await router.push({ name: 'importRules' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <FormPanel type="new" model-name="import_rule" gender="female" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <ImportRuleFields v-model="form" :errors="errors" />
    </template>
  </FormPanel>
</template>
