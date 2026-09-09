<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="columns not-found">
    <div class="column has-text-centered">
      <p class="not-found-code has-text-primary" aria-hidden="true">404</p>
      <h1 class="title">{{ t('notFound.title') }}</h1>
      <p class="subtitle">{{ t('notFound.description') }}</p>
      <router-link class="button is-primary" :to="{ name: 'monthly_statement' }">
        {{ t('notFound.goHome') }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 104px);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 !important;
}

.not-found-code {
  font-size: 6rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}
</style>
