<script setup lang="ts">
import { createEmailConfirmation } from '@/api/user';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NotificationMessage from '@/components/NotificationMessage.vue';

type ConfirmEmailForm = {
  token: string;
};

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(true);
const form = reactive<ConfirmEmailForm>({ token: '' });
const { errors, applyCatch, createHandler } = useFormErrors(form);

async function confirmEmail() {
  form.token = typeof route.query.token === 'string' ? route.query.token : '';

  if (!form.token) {
    errors.value = createHandler().addBase(t('user.confirmEmail.tokenMissing')).all;
    loading.value = false;
    return;
  }

  try {
    const response = await createEmailConfirmation({ token: form.token });
    await router.push({ name: 'signIn' });
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}

function clearErrors() {
  errors.value = { ...errors.value, base: [], token: [] };
}

onMounted(() => {
  void confirmEmail();
});
</script>

<template>
  <div class="columns login">
    <div class="column has-background-light confirm-screen has-text-centered">
      <h1 class="title">{{ t('user.confirmEmail.title') }}</h1>

      <div v-if="loading" class="field">
        <p>{{ t('user.confirmEmail.confirming') }}</p>
        <progress class="progress is-primary is-small" max="100">
          {{ t('user.confirmEmail.loading') }}
        </progress>
      </div>

      <div v-else-if="errors.base.length || errors.token.length" class="field">
        <NotificationMessage type="danger" @close="clearErrors">
          <p v-for="error in errors.base" :key="error">{{ error }}</p>
          <p v-for="error in errors.token" :key="error">{{ error }}</p>
        </NotificationMessage>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: calc(100vh - 104px);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 !important;
  padding: 0 !important;
}

.confirm-screen {
  min-width: 295px;
  max-width: 700px;
  margin: 20px;
  margin-bottom: 50px;
  padding: 30px;
  border-radius: 20px;
}
</style>
