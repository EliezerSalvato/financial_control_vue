<script setup lang="ts">
import type { LogoOption } from '@/components/inputs/LogoSelect.vue';
import type { Institution } from '@/types/institution';
import { useCreateOptionModal } from '@/composables/useCreateOptionModal';
import { useI18n } from 'vue-i18n';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import LogoSelect from '@/components/inputs/LogoSelect.vue';
import Modal from '@/components/Modal.vue';
import NewInstitution from '@/pages/institutions/New.vue';

const { t } = useI18n();

const model = defineModel<string>({ required: true });
const items = defineModel<LogoOption[]>('items', { required: true });

defineProps<{
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean | string | null;
}>();

const { modalOpen, openModal, closeModal, onCreated } = useCreateOptionModal({
  items,
  model,
  mapOption: (institution: Institution) => ({
    key: institution.id,
    label: institution.name,
    url: institutionLogoUrl(institution.logoKey),
  }),
});
</script>

<template>
  <LogoSelect
    v-model="model"
    :name="name"
    :label="label"
    :placeholder="placeholder"
    :items="items"
    :required="required"
    :disabled="disabled"
    :error="error"
  >
    <template v-if="!disabled" #addon>
      <button
        type="button"
        class="button is-primary"
        :aria-label="t('buttons.new.female', { name: t('models.institution') })"
        :title="t('buttons.new.female', { name: t('models.institution') })"
        @click="openModal"
      >
        <i class="fa fa-plus" aria-hidden="true"></i>
      </button>
    </template>
  </LogoSelect>

  <Teleport to="body">
    <Modal :open-modal="modalOpen" @close="closeModal">
      <template #body>
        <div class="institution-modal-body">
          <NewInstitution v-if="modalOpen" modal @new:institution="onCreated" />
        </div>
      </template>
      <template #footer>
        <button type="button" class="button" @click="closeModal">{{ t('buttons.back') }}</button>
      </template>
    </Modal>
  </Teleport>
</template>

<style scoped>
.institution-modal-body :deep(.columns) {
  margin: 0;
}

.institution-modal-body :deep(.column) {
  padding: 0;
}

.institution-modal-body :deep(.panel) {
  margin-bottom: 0;
  box-shadow: none;
}
</style>
