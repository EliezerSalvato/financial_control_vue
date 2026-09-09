<script setup lang="ts">
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { Category } from '@/types/category';
import { useCreateOptionModal } from '@/composables/useCreateOptionModal';
import { useI18n } from 'vue-i18n';
import ColorSelect from '@/components/inputs/ColorSelect.vue';
import Modal from '@/components/Modal.vue';
import NewCategory from '@/pages/categories/New.vue';

const { t } = useI18n();

const model = defineModel<string>({ required: true });
const items = defineModel<ColorOption[]>('items', { required: true });

defineProps<{
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}>();

const { modalOpen, openModal, closeModal, onCreated } = useCreateOptionModal({
  items,
  model,
  mapOption: (category: Category) => ({
    key: category.id,
    label: category.name,
    color: category.color,
  }),
});
</script>

<template>
  <ColorSelect v-model="model" :name="name" :label="label" :placeholder="placeholder" :items="items" :required="required" :error="error">
    <template #addon>
      <button
        type="button"
        class="button is-primary"
        :aria-label="t('buttons.new.female', { name: t('models.category') })"
        :title="t('buttons.new.female', { name: t('models.category') })"
        @click="openModal"
      >
        <i class="fa fa-plus" aria-hidden="true"></i>
      </button>
    </template>
  </ColorSelect>

  <Teleport to="body">
    <Modal :open-modal="modalOpen" @close="closeModal">
      <template #body>
        <div class="category-modal-body">
          <NewCategory v-if="modalOpen" modal @new:category="onCreated" />
        </div>
      </template>
      <template #footer>
        <button type="button" class="button" @click="closeModal">{{ t('buttons.back') }}</button>
      </template>
    </Modal>
  </Teleport>
</template>

<style scoped>
.category-modal-body :deep(.columns) {
  margin: 0;
}

.category-modal-body :deep(.column) {
  padding: 0;
}

.category-modal-body :deep(.panel) {
  margin-bottom: 0;
  box-shadow: none;
}
</style>
