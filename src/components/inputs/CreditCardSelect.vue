<script setup lang="ts">
import type { LogoOption } from '@/components/inputs/LogoSelect.vue';
import type { CreditCard } from '@/types/credit_card';
import { useCreateOptionModal } from '@/composables/useCreateOptionModal';
import { useI18n } from 'vue-i18n';
import { networkLogoUrl } from '@/utils/networkLogos';
import LogoSelect from '@/components/inputs/LogoSelect.vue';
import Modal from '@/components/Modal.vue';
import NewCreditCard from '@/pages/credit_cards/New.vue';

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
  mapOption: (creditCard: CreditCard) => ({
    key: creditCard.id,
    label: creditCard.name,
    url: networkLogoUrl(creditCard.network),
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
        :aria-label="t('buttons.new.male', { name: t('models.credit_card') })"
        :title="t('buttons.new.male', { name: t('models.credit_card') })"
        @click="openModal"
      >
        <i class="fa fa-plus" aria-hidden="true"></i>
      </button>
    </template>
  </LogoSelect>

  <Teleport to="body">
    <Modal :open-modal="modalOpen" @close="closeModal">
      <template #body>
        <div class="credit-card-modal-body">
          <NewCreditCard v-if="modalOpen" modal @new:creditCard="onCreated" />
        </div>
      </template>
      <template #footer>
        <button type="button" class="button" @click="closeModal">{{ t('buttons.back') }}</button>
      </template>
    </Modal>
  </Teleport>
</template>

<style scoped>
.credit-card-modal-body :deep(.columns) {
  margin: 0;
}

.credit-card-modal-body :deep(.column) {
  padding: 0;
}

.credit-card-modal-body :deep(.panel) {
  margin-bottom: 0;
  box-shadow: none;
}
</style>
