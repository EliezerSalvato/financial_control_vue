<script setup lang="ts">
import type { RegistrationForm } from '@/types/user';
import { createRegistration } from '@/api/user';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';
import { useFormErrors } from '@/composables/useFormErrors';
import { reactive, ref } from 'vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import UserLinks from '@/components/user/UserLinks.vue';

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();
const loading = ref(false);

const form = reactive<RegistrationForm>({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  passwordConfirmation: '',
});

const { errors, validateWith, applyCatch } = useFormErrors(form);

function validate(): boolean {
  return validateWith((handler) =>
    handler
      .checkBlank(['email', 'firstName', 'lastName', 'password', 'passwordConfirmation'])
      .checkEmail(['email'])
      .checkMinLength(['password'], 8)
      .checkConfirmation('password', 'passwordConfirmation', t('user.registration.password')),
  );
}

async function onSubmit() {
  if (!validate()) return;

  loading.value = true;

  try {
    const response = await createRegistration({ ...form });
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
    <div class="column has-background-light signup-screen has-text-centered">
      <h1 class="title">{{ t('user.registration.title') }}</h1>

      <div class="field">
        <form @submit.prevent="onSubmit">
          <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
            <p v-for="error in errors.base" :key="error">{{ error }}</p>
          </NotificationMessage>

          <InputText
            v-model="form.email"
            name="email"
            type="text"
            :label="t('user.registration.email')"
            required
            :errors="errors.email"
            autocomplete="email"
          />

          <InputText
            v-model="form.firstName"
            name="firstName"
            :label="t('user.registration.firstName')"
            required
            :errors="errors.firstName"
            autocomplete="given-name"
          />

          <InputText
            v-model="form.lastName"
            name="lastName"
            :label="t('user.registration.lastName')"
            required
            :errors="errors.lastName"
            autocomplete="family-name"
          />

          <InputText
            v-model="form.password"
            name="password"
            type="password"
            :label="t('user.registration.password')"
            required
            :errors="errors.password"
            autocomplete="new-password"
          />

          <InputText
            v-model="form.passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            :label="t('user.registration.passwordConfirmation')"
            required
            :errors="errors.passwordConfirmation"
            autocomplete="new-password"
          />

          <br />
          <div class="field">
            <div class="control">
              <button type="submit" class="button is-primary is-fullwidth" :class="{ 'is-loading': loading }" :disabled="loading">
                {{ t('buttons.signUp') }}
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

.signup-screen {
  min-width: 295px;
  max-width: 700px;
  margin: 20px;
  margin-bottom: 50px;
  padding: 30px;
  border-radius: 20px;
  min-height: 680px;
}
</style>
