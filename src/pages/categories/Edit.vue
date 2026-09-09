<script setup lang="ts">
import type { CategoryForm } from '@/types/category';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { getCategory, updateCategory } from '@/api/categories';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, reactive, ref, useTemplateRef } from 'vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import ColorPicker from '@/components/inputs/ColorPicker.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(true);

const form = reactive<CategoryForm>({
  name: '',
  color: '',
  active: true,
});

const { errors, validateWith, applyCatch } = useFormErrors(form);

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['name', 'color']));
}

async function loadCategory() {
  const id = String(route.params.id);

  loading.value = true;

  try {
    const result = await getCategory(id);

    form.name = result.name;
    form.color = result.color;
    form.active = result.active;

    nameInput.value?.focus();
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
    const result = await updateCategory(String(route.params.id), {
      category: {
        name: form.name,
        color: form.color,
        active: form.active,
      },
    });

    await router.push({ name: 'categories' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadCategory();
});
</script>

<template>
  <FormPanel type="edit" model-name="category" gender="female" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText ref="nameInput" v-model="form.name" name="name" :label="t('categories.form.name')" required :errors="errors.name" />

      <ColorPicker v-model="form.color" name="color" :label="t('categories.form.color')" required :errors="errors.color" />

      <div class="field">
        <div class="control">
          <CheckBox v-model="form.active" name="active" :label="t('categories.form.active')" />
        </div>
      </div>
    </template>
  </FormPanel>
</template>
