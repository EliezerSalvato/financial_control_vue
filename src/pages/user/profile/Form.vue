<script setup lang="ts">
import type { NameForm } from '@/types/user';
import { updateProfile } from '@/api/user';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { useUserStore } from '@/stores/user';
import { useFormErrors } from '@/composables/useFormErrors';
import { reactive, ref } from 'vue';
import ChangeEmail from './ChangeEmail.vue';
import ChangePassword from './ChangePassword.vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const { t } = useI18n();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const nameLoading = ref(false);

const nameForm = reactive<NameForm>({
  firstName: userStore.user?.firstName ?? '',
  lastName: userStore.user?.lastName ?? '',
});

const { errors: nameErrors, validateWith, applyCatch } = useFormErrors(nameForm);

function validateName(): boolean {
  return validateWith((handler) => handler.checkBlank(['firstName', 'lastName']));
}

async function onUpdateName() {
  notificationStore.setCurrentMessage('');

  if (!validateName()) return;

  nameLoading.value = true;

  try {
    const response = await updateProfile({ ...nameForm });
    notificationStore.setCurrentMessage(response.message || t('user.profile.success'), 'success');

    if (userStore.user) {
      userStore.setUser({
        ...userStore.user,
        firstName: nameForm.firstName,
        lastName: nameForm.lastName,
        fullName: `${nameForm.firstName} ${nameForm.lastName}`.trim(),
      });
    }
  } catch (error) {
    applyCatch(error);
  } finally {
    nameLoading.value = false;
  }
}
</script>

<template>
  <div class="columns">
    <div class="column profile">
      <nav class="panel">
        <p class="panel-heading">{{ t('user.profile.title') }}</p>
        <div class="panel-block">
          <form class="profile-form" @submit.prevent="onUpdateName">
            <NotificationMessage />

            <NotificationMessage v-if="nameErrors.base.length" type="danger" @close="nameErrors.base = []">
              <p v-for="error in nameErrors.base" :key="error">{{ error }}</p>
            </NotificationMessage>

            <InputText
              v-model="nameForm.firstName"
              name="firstName"
              :label="t('user.profile.firstName')"
              required
              :errors="nameErrors.firstName"
              autocomplete="given-name"
            />

            <InputText
              v-model="nameForm.lastName"
              name="lastName"
              :label="t('user.profile.lastName')"
              required
              :errors="nameErrors.lastName"
              autocomplete="family-name"
            />

            <div class="field form-actions">
              <div class="control">
                <button type="submit" class="button is-primary" :class="{ 'is-loading': nameLoading }" :disabled="nameLoading">
                  {{ t('buttons.save') }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </nav>

      <ChangeEmail />

      <ChangePassword />
    </div>
  </div>
</template>

<style scoped>
.columns {
  margin: 0 auto;
  max-width: 1344px;
}

.profile {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile-form {
  width: 100%;
}
</style>
