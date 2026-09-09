<script setup lang="ts">
import type { Institution, InstitutionForm } from '@/types/institution';
import { createInstitution } from '@/api/institutions';
import { useFormErrors } from '@/composables/useFormErrors';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';
import { listInstitutionLogos } from '@/utils/institutionLogos';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import FormPanel from '@/components/FormPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import LogoSelect from '@/components/inputs/LogoSelect.vue';
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
  'new:institution': [institution: Institution];
}>();

const { t, te } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const nameInput = useTemplateRef<{ focus: () => void }>('nameInput');
const loading = ref(false);

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

async function save() {
  if (!validate()) return;

  loading.value = true;

  try {
    const result = await createInstitution({
      institution: { name: form.name, logoKey: form.logoKey },
    });

    if (props.modal) {
      emit('new:institution', result.institution);
      return;
    }

    await router.push({ name: 'institutions' });
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
  <FormPanel type="new" model-name="institution" gender="female" :hidden-back="modal" :show-loading="loading" @call:save="save">
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
    </template>
  </FormPanel>
</template>
