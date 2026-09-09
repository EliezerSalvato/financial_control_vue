<script setup lang="ts">
import type { ForgotPasswordForm } from '@/types/user';
import { createPasswordReset } from '@/api/user';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { reactive, ref } from 'vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import UserLinks from '@/components/user/UserLinks.vue';

const { t } = useI18n();
const notificationStore = useNotificationStore();
const loading = ref(false);

const form = reactive<ForgotPasswordForm>({
  email: '',
});

const { errors, validateWith, applyCatch } = useFormErrors(form);

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['email']).checkEmail(['email']));
}

async function onSubmit() {
  if (!validate()) return;

  loading.value = true;
  notificationStore.setCurrentMessage('');

  try {
    const response = await createPasswordReset({ email: form.email });
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="columns login">
    <div class="column has-background-light forgot-screen has-text-centered">
      <h1 class="title">{{ t('user.forgotPassword.title') }}</h1>

      <div class="field">
        <form @submit.prevent="onSubmit">
          <NotificationMessage />

          <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
            <p v-for="error in errors.base" :key="error">{{ error }}</p>
          </NotificationMessage>

          <InputText v-model="form.email" name="email" :label="t('user.forgotPassword.email')" required :errors="errors.email" autocomplete="email" />

          <div class="field">
            <div class="control">
              <button type="submit" class="button is-primary is-fullwidth" :class="{ 'is-loading': loading }" :disabled="loading">
                {{ t('buttons.sendResetPasswordInstructions') }}
              </button>
            </div>
          </div>
        </form>

        <br />

        <UserLinks />
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

.forgot-screen {
  min-width: 295px;
  max-width: 700px;
  margin: 20px;
  margin-bottom: 50px;
  padding: 30px;
  border-radius: 20px;
}
</style>
