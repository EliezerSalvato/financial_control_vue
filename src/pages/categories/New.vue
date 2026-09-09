<script setup lang="ts">
import type { Category, CategoryForm } from '@/types/category';
import { createCategory } from '@/api/categories';
import { useFormErrors } from '@/composables/useFormErrors';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';
import { onMounted, reactive, ref, useTemplateRef } from 'vue';
import { randomHexColor } from '@/utils/color';
import ColorPicker from '@/components/inputs/ColorPicker.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const props = withDefaults(
  defineProps<{
    modal?: boolean;
  }>(),
  {
    modal: false,
  },
);

const emit = defineEmits<{
  'new:category': [category: Category];
}>();

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(false);

const form = reactive<CategoryForm>({
  name: '',
  color: randomHexColor(),
  active: true,
});

const { errors, validateWith, applyCatch } = useFormErrors(form);

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['name', 'color']));
}

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await createCategory({ category: { name: form.name, color: form.color } });

    if (props.modal) {
      emit('new:category', result.category);
      return;
    }

    await router.push({ name: 'categories' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  nameInput.value?.focus();
});
</script>

<template>
  <FormPanel type="new" model-name="category" gender="female" :hidden-back="modal" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText ref="nameInput" v-model="form.name" name="name" :label="t('categories.form.name')" required :errors="errors.name" />

      <ColorPicker v-model="form.color" name="color" :label="t('categories.form.color')" required :errors="errors.color" />
    </template>
  </FormPanel>
</template>
