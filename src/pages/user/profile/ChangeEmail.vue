<script setup lang="ts">
import type { EmailForm } from '@/types/user';
import { updateEmail } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useFormErrors } from '@/composables/useFormErrors';
import { reactive, ref } from 'vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const emailLoading = ref(false);

const emailForm = reactive<EmailForm>({
  currentPassword: '',
  newEmail: userStore.user?.email ?? '',
});

const { errors: emailErrors, validateWith, applyCatch } = useFormErrors(emailForm);

function validateEmail(): boolean {
  return validateWith((handler) => handler.checkBlank(['currentPassword', 'newEmail']));
}

async function endSessionAndRedirect(notice: string) {
  try {
    await authStore.logout();
  } catch {
    // logout() já limpa o estado local se a revogação falhar
  }

  await router.push({ name: 'signIn' });
  notificationStore.setCurrentMessage(notice, 'success');
}

async function onUpdateEmail() {
  if (!validateEmail()) return;

  emailLoading.value = true;

  try {
    const response = await updateEmail({ ...emailForm });
    await endSessionAndRedirect(response.message || t('user.changeEmail.success'));
  } catch (error) {
    applyCatch(error);
  } finally {
    emailLoading.value = false;
  }
}
</script>

<template>
  <nav class="panel">
    <p class="panel-heading">{{ t('user.changeEmail.title') }}</p>
    <div class="panel-block">
      <form class="profile-form" @submit.prevent="onUpdateEmail">
        <NotificationMessage v-if="emailErrors.base.length" type="danger" @close="emailErrors.base = []">
          <p v-for="error in emailErrors.base" :key="error">{{ error }}</p>
        </NotificationMessage>

        <InputText
          v-model="emailForm.currentPassword"
          name="currentPassword"
          type="password"
          :label="t('user.changeEmail.currentPassword')"
          required
          :errors="emailErrors.currentPassword"
          autocomplete="current-password"
        />

        <InputText
          v-model="emailForm.newEmail"
          name="email"
          type="email"
          :label="t('user.changeEmail.email')"
          required
          :errors="emailErrors.newEmail"
          autocomplete="email"
        />

        <div class="field form-actions">
          <div class="control">
            <button type="submit" class="button is-primary" :class="{ 'is-loading': emailLoading }" :disabled="emailLoading">
              {{ t('buttons.save') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </nav>
</template>

<style scoped>
.profile-form {
  width: 100%;
}
</style>
