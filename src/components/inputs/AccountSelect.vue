<script setup lang="ts">
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { Account } from '@/types/account';
import { useCreateOptionModal } from '@/composables/useCreateOptionModal';
import { useI18n } from 'vue-i18n';
import ColorSelect from '@/components/inputs/ColorSelect.vue';
import Modal from '@/components/Modal.vue';
import NewAccount from '@/pages/accounts/New.vue';

const { t } = useI18n();

const model = defineModel<string>({ required: true });
const items = defineModel<ColorOption[]>('items', { required: true });

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
  mapOption: (account: Account) => ({
    key: account.id,
    label: account.name,
    color: account.color,
  }),
});
</script>

<template>
  <ColorSelect
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
        :aria-label="t('buttons.new.female', { name: t('models.account') })"
        :title="t('buttons.new.female', { name: t('models.account') })"
        @click="openModal"
      >
        <i class="fa fa-plus" aria-hidden="true"></i>
      </button>
    </template>
  </ColorSelect>

  <Teleport to="body">
    <Modal :open-modal="modalOpen" @close="closeModal">
      <template #body>
        <div class="account-modal-body">
          <NewAccount v-if="modalOpen" modal @new:account="onCreated" />
        </div>
      </template>
      <template #footer>
        <button type="button" class="button" @click="closeModal">{{ t('buttons.back') }}</button>
      </template>
    </Modal>
  </Teleport>
</template>

<style scoped>
.account-modal-body :deep(.columns) {
  margin: 0;
}

.account-modal-body :deep(.column) {
  padding: 0;
}

.account-modal-body :deep(.panel) {
  margin-bottom: 0;
  box-shadow: none;
}
</style>
