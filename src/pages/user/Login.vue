<script setup lang="ts">
import type { LoginForm } from '@/types/auth';
import { createAuthentication } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import { useFormErrors } from '@/composables/useFormErrors';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NotificationMessage from '@/components/NotificationMessage.vue';
import UserLinks from '@/components/user/UserLinks.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userStore = useUserStore();
const loading = ref(false);

const form = reactive<LoginForm>({
  email: '',
  password: '',
  rememberMe: false,
});

const { errors, validateWith, applyCatch } = useFormErrors(form);

function validate(): boolean {
  return validateWith((handler) => handler.checkBlank(['email', 'password']));
}

async function onSubmit() {
  if (!validate()) return;

  loading.value = true;

  try {
    const response = await createAuthentication({ ...form });
    authStore.setToken(response.data.token);
    authStore.setRememberMe(form.rememberMe);
    userStore.setUser(response.data.user);

    await router.push(safeRedirectPath(route.query.redirect));
  } catch (error) {
    applyCatch(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="columns login">
    <div class="column has-background-light login-screen has-text-centered">
      <h1 class="title">{{ t('auth.login.title') }}</h1>

      <div class="field">
        <form @submit.prevent="onSubmit">
          <NotificationMessage />

          <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
            <p v-for="error in errors.base" :key="error">{{ error }}</p>
          </NotificationMessage>

          <div class="field">
            <div class="control has-icons-right">
              <input
                v-model="form.email"
                type="text"
                name="email"
                class="input"
                :class="errors.email.length ? 'is-danger' : 'is-primary'"
                :placeholder="t('auth.login.emailPlaceholder')"
                autocomplete="username"
                autofocus
              />
              <span class="icon is-small is-right">
                <i class="fas fa-user"></i>
              </span>
            </div>
            <p v-if="errors.email.length" class="help is-danger has-text-left">
              {{ errors.email[0] }}
            </p>
          </div>

          <div class="field">
            <div class="control has-icons-right">
              <input
                v-model="form.password"
                type="password"
                name="password"
                class="input"
                :class="errors.password.length ? 'is-danger' : 'is-primary'"
                :placeholder="t('auth.login.passwordPlaceholder')"
                autocomplete="current-password"
              />
              <span class="icon is-small is-right">
                <i class="fas fa-lock"></i>
              </span>
            </div>
            <p v-if="errors.password.length" class="help is-danger has-text-left">
              {{ errors.password[0] }}
            </p>
          </div>

          <br />

          <div class="field">
            <div class="control">
              <label class="checkbox is-primary">
                <input v-model="form.rememberMe" type="checkbox" name="rememberMe" />
                {{ t('auth.login.rememberMe') }}
              </label>
            </div>
          </div>

          <div class="field">
            <div class="control">
              <button type="submit" class="button is-primary is-fullwidth" :class="{ 'is-loading': loading }" :disabled="loading">
                {{ t('buttons.login') }}
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

.login-screen {
  min-width: 295px;
  max-width: 700px;
  margin: 20px;
  margin-bottom: 50px;
  padding: 30px;
  border-radius: 20px;
}
</style>
