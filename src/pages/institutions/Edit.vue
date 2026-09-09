<script setup lang="ts">
import type { InstitutionForm } from '@/types/institution';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { getInstitution, updateInstitution } from '@/api/institutions';
import { listInstitutionLogos } from '@/utils/institutionLogos';
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import FormPanel from '@/components/FormPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import LogoSelect from '@/components/inputs/LogoSelect.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(true);

const form = reactive<InstitutionForm>({
  name: '',
  logoKey: '',
  active: true,
});

const { errors, validateWith, applyCatch } = useFormErrors(form);
const logoItems = computed(() =>
  listInstitutionLogos().map((logo) => {
    const translationKey = `institutions.logos.${logo.key}`;

    return {
      ...logo,
      label: te(translationKey) ? t(translationKey) : logo.label,
    };
  }),
);

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['name', 'logoKey']));
}

async function loadInstitution() {
  const id = String(route.params.id);

  loading.value = true;

  try {
    const result = await getInstitution(id);

    form.name = result.name;
    form.logoKey = result.logoKey;
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
    const result = await updateInstitution(String(route.params.id), {
      institution: {
        name: form.name,
        logoKey: form.logoKey,
        active: form.active,
      },
    });

    await router.push({ name: 'institutions' });
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadInstitution();
});
</script>

<template>
  <FormPanel type="edit" model-name="institution" gender="female" :show-loading="loading" @call:save="save">
    <template #form>
      <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
        <p v-for="error in errors.base" :key="error">{{ error }}</p>
      </NotificationMessage>

      <InputText ref="nameInput" v-model="form.name" name="name" :label="t('institutions.form.name')" required :errors="errors.name" />

      <LogoSelect
        v-model="form.logoKey"
        name="logoKey"
        :label="t('institutions.form.logoKey')"
        :placeholder="t('institutions.form.logoKeyPlaceholder')"
        :items="logoItems"
        required
        :error="errors.logoKey[0]"
      />

      <div class="field">
        <div class="control">
          <CheckBox v-model="form.active" name="active" :label="t('institutions.form.active')" />
        </div>
      </div>
    </template>
  </FormPanel>
</template>
