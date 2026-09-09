<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/Modal.vue';

const props = withDefaults(
  defineProps<{
    modelName: string;
    currentItemId: string;
    gender?: 'male' | 'female';
    open?: boolean;
    itemName?: string | null;
    message?: string | null;
    canConfirm?: boolean;
  }>(),
  {
    gender: 'male',
    open: false,
    itemName: null,
    message: null,
    canConfirm: true,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  'delete:item': [itemId: string];
}>();

const { t } = useI18n();

const currentItemName = computed(() => (props.itemName ? ` "${props.itemName}"` : ''));

const deleteMessage = computed(() => {
  const text =
    props.message ??
    t(`modalDelete.confirm.${props.gender}`, {
      modelName: t(`models.${props.modelName}`),
      itemName: currentItemName.value,
    });

  return text.trim();
});

function close() {
  emit('update:open', false);
}

function deleteItem() {
  emit('delete:item', props.currentItemId);
}
</script>

<template>
  <Modal :title="t('modalDelete.title')" :open-modal="open" @close="close">
    <template #body>
      <p class="delete-message">{{ deleteMessage }}</p>
    </template>
    <template #footer>
      <button v-if="canConfirm" class="button is-success" @click="deleteItem">{{ t('buttons.yes') }}</button>
      <button class="button" @click="close">{{ canConfirm ? t('buttons.no') : t('buttons.ok') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.modal {
  margin-top: -15%;
}

.delete-message {
  white-space: pre-line;
}
</style>
