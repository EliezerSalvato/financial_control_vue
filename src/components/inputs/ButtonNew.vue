<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

defineProps<{
  name?: string;
  route: RouteLocationRaw;
}>();
</script>

<template>
  <router-link class="button is-primary" :to="route" :aria-label="name" :title="name">
    <i class="fa fa-plus" aria-hidden="true"></i>
    <b v-if="name" class="is-hidden-touch">{{ name }}</b>
  </router-link>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

b {
  margin-left: 5px;
  text-transform: capitalize;
}

@media screen and (max-width: 1023px) {
  .button {
    width: 2.5em;
    min-width: 2.5em;
    height: 2.5em;
    padding: 0;
  }

  i {
    margin: 0;
    line-height: 1;
    width: 1em;
    text-align: center;
  }
}
</style>
