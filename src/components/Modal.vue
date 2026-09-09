<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    openModal?: boolean;
  }>(),
  {
    openModal: false,
  },
);

const emit = defineEmits<{
  close: [];
}>();

function close() {
  emit('close');
}
</script>

<template>
  <div class="modal" :class="{ 'is-active': openModal }">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header v-if="title" class="modal-card-head">
        <p class="modal-card-title">{{ title }}</p>
        <button class="delete" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <slot name="body" />
      </section>

      <footer class="modal-card-foot">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-card {
  max-width: calc(100% - 30px);
}

.modal-card-foot {
  justify-content: flex-end;
}
</style>
