<script setup lang="ts">
const model = defineModel<boolean>({ default: false });

defineProps<{
  name?: string;
  label?: string;
}>();
</script>

<template>
  <label class="checkbox" :for="name">
    <input :id="name" type="checkbox" v-model="model" :name="name" />
    {{ label }}
  </label>
</template>

<style scoped>
.panel-block input[type='checkbox'] {
  margin-right: 3px;
}
</style>
