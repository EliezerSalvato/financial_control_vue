<script setup lang="ts">
import type { ResetPasswordForm } from '@/types/user';
import { updatePasswordReset } from '@/api/user';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useFormErrors } from '@/composables/useFormErrors';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import UserLinks from '@/components/user/UserLinks.vue';

type ResetPasswordFields = ResetPasswordForm & { token: string };

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const loading = ref(false);

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));

const form = reactive<ResetPasswordForm>({
  password: '',
  passwordConfirmation: '',
});

const { errors, validateWith, applyCatch } = useFormErrors((): ResetPasswordFields => ({ ...form, token: token.value }));

function validate(): boolean {
  return validateWith((handler) =>
    handler
      .checkBlank(['token', 'password', 'passwordConfirmation'])
      .checkMinLength(['password'], 8)
      .checkConfirmation('password', 'passwordConfirmation', t('user.resetPassword.password')),
  );
}

async function onSubmit() {
  if (!validate()) return;

  loading.value = true;

  try {
    const response = await updatePasswordReset({
      token: token.value,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
    });

    await router.push({ name: 'signIn' });
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
    <div class="column has-background-light reset-screen has-text-centered">
      <h1 class="title">{{ t('user.resetPassword.title') }}</h1>

      <div class="field">
        <form @submit.prevent="onSubmit">
          <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
            <p v-for="error in errors.base" :key="error">{{ error }}</p>
          </NotificationMessage>

          <NotificationMessage v-if="errors.token.length" type="danger" @close="errors.token = []">
            <p v-for="error in errors.token" :key="error">{{ error }}</p>
          </NotificationMessage>

          <InputText
            v-model="form.password"
            name="password"
            type="password"
            :label="t('user.resetPassword.password')"
            required
            :errors="errors.password"
            autocomplete="new-password"
          />

          <InputText
            v-model="form.passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            :label="t('user.resetPassword.passwordConfirmation')"
            required
            :errors="errors.passwordConfirmation"
            autocomplete="new-password"
          />

          <div class="field">
            <div class="control">
              <button type="submit" class="button is-primary is-fullwidth" :class="{ 'is-loading': loading }" :disabled="loading">
                {{ t('buttons.changeMyPassword') }}
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

.reset-screen {
  min-width: 295px;
  max-width: 700px;
  margin: 20px;
  margin-bottom: 50px;
  padding: 30px;
  border-radius: 20px;
}
</style>
