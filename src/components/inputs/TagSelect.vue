<script setup lang="ts">
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { Tag } from '@/types/tag';
import { useCreateOptionModal } from '@/composables/useCreateOptionModal';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/Modal.vue';
import NewTag from '@/pages/tags/New.vue';
import SelectMultiple from '@/components/inputs/SelectMultiple.vue';

const { t } = useI18n();

const model = defineModel<string[]>({ required: true });
const items = defineModel<ColorOption[]>('items', { required: true });

defineProps<{
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
}>();

const { modalOpen, openModal, closeModal, onCreated } = useCreateOptionModal({
  items,
  model,
  mapOption: (tag: Tag) => ({
    key: tag.id,
    label: tag.name,
    color: tag.color,
  }),
});
</script>

<template>
  <SelectMultiple v-model="model" :name="name" :label="label" :placeholder="placeholder" :items="items" :error="error">
    <template #addon>
      <button
        type="button"
        class="button is-primary"
        :aria-label="t('buttons.new.female', { name: t('models.tag') })"
        :title="t('buttons.new.female', { name: t('models.tag') })"
        @click="openModal"
      >
        <i class="fa fa-plus" aria-hidden="true"></i>
      </button>
    </template>
  </SelectMultiple>

  <Teleport to="body">
    <Modal :open-modal="modalOpen" @close="closeModal">
      <template #body>
        <div class="tag-modal-body">
          <NewTag v-if="modalOpen" modal @new:tag="onCreated" />
        </div>
      </template>
      <template #footer>
        <button type="button" class="button" @click="closeModal">{{ t('buttons.back') }}</button>
      </template>
    </Modal>
  </Teleport>
</template>

<style scoped>
.tag-modal-body :deep(.columns) {
  margin: 0;
}

.tag-modal-body :deep(.column) {
  padding: 0;
}

.tag-modal-body :deep(.panel) {
  margin-bottom: 0;
  box-shadow: none;
}
</style>
