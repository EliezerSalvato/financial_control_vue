<script setup lang="ts">
const model = defineModel<boolean>({ default: false });

defineProps<{
  name?: string;
  label?: string;
  disabled?: boolean;
}>();
</script>

<template>
  <label class="checkbox" :for="name">
    <input :id="name" type="checkbox" v-model="model" :name="name" :disabled="disabled" />
    {{ label }}
  </label>
</template>

<style scoped>
.panel-block input[type='checkbox'] {
  margin-right: 3px;
}
</style>
