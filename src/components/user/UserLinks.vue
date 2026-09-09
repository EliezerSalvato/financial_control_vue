<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();

const links = computed(() =>
  [
    { name: 'signIn', label: t('user.links.signIn') },
    { name: 'signUp', label: t('user.links.signUp') },
    { name: 'forgotPassword', label: t('user.links.forgotPassword') },
  ].filter((link) => link.name !== route.name),
);
</script>

<template>
  <div v-for="link in links" :key="link.name" class="field">
    <div class="control">
      <RouterLink :to="{ name: link.name }">{{ link.label }}</RouterLink>
    </div>
  </div>
</template>
