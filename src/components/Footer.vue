<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const year = new Date().getFullYear();
</script>

<template>
  <nav class="nav-footer navbar is-fixed-bottom is-primary">
    <div class="content">© {{ year }} {{ t('appName') }}</div>
  </nav>
</template>

<style scoped></style>
