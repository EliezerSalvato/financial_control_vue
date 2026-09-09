<script setup lang="ts">
import { getNotification } from '@/api/notifications';
import { useAppLocale } from '@/composables/useAppLocale';
import { formatFrontDateTime } from '@/locales/locale';
import { TRANSACTION_NOTIFIABLE_TYPE, type InboxNotification } from '@/types/inbox_notification';
import { useI18n } from 'vue-i18n';
import { useInboxNotificationsStore } from '@/stores/inboxNotifications';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Loading from '@/components/Loading.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';

const { t } = useI18n();
const route = useRoute();
const inboxStore = useInboxNotificationsStore();
const { appLocale } = useAppLocale();

const loading = ref(true);
const item = ref<InboxNotification | null>(null);
const createdAtLabel = computed(() => (item.value ? formatFrontDateTime(item.value.createdAt, appLocale.value) : ''));
const formattedData = computed(() => {
  const data = item.value?.data;
  if (!data || Object.keys(data).length === 0) return '';

  return JSON.stringify(data, null, 2);
});
const hasNotifiable = computed(() => Boolean(item.value?.notifiableType || item.value?.notifiableId));
const transactionEditTo = computed(() => {
  const notification = item.value;
  if (!notification?.notifiableId) return null;

  if (notification.notifiableType !== TRANSACTION_NOTIFIABLE_TYPE) return null;

  return { name: 'transactionsEdit', params: { id: notification.notifiableId } };
});

async function loadNotification() {
  const id = String(route.params.id);

  loading.value = true;

  try {
    const result = await getNotification(id);

    item.value = result;

    if (!result.read) {
      const readResult = await inboxStore.markAsRead(id, false);

      item.value = readResult.notification;
    }
  } catch (error) {
    notifyApiError(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => String(route.params.id),
  () => {
    void loadNotification();
  },
  { immediate: true },
);
</script>

<template>
  <div class="columns">
    <Loading v-show="loading" />

    <div v-show="!loading" class="column">
      <NotificationMessage />

      <nav v-if="item" class="panel">
        <p class="panel-heading">{{ t('notifications.details') }}</p>

        <div class="panel-block">
          <div class="inbox-details">
            <h2 class="title is-5">{{ item.title }}</h2>
            <p class="inbox-meta">
              <time :datetime="item.createdAt">{{ createdAtLabel }}</time>
              <span class="tag" :class="item.read ? 'is-light' : 'is-info'">
                {{ item.read ? t('notifications.read') : t('notifications.unread') }}
              </span>
            </p>
            <p v-if="item.body" class="inbox-body">{{ item.body }}</p>

            <div v-if="hasNotifiable" class="inbox-related">
              <p class="label">{{ t('notifications.relatedRecord') }}</p>
              <p v-if="item.notifiableType" class="inbox-related-row">
                <span class="inbox-related-key">{{ t('notifications.notifiableType') }}:</span>
                {{ item.notifiableType }}
              </p>
              <p v-if="item.notifiableId" class="inbox-related-row">
                <span class="inbox-related-key">{{ t('notifications.notifiableId') }}:</span>
                {{ item.notifiableId }}
              </p>
              <p v-if="transactionEditTo" class="inbox-related-row">
                <router-link :to="transactionEditTo">
                  {{ t('buttons.edit.female', { name: t('models.transaction') }) }}
                </router-link>
              </p>
            </div>

            <div v-if="formattedData" class="inbox-data">
              <p class="label">{{ t('notifications.data') }}</p>
              <pre class="inbox-data-json"><code>{{ formattedData }}</code></pre>
            </div>

            <div class="field form-actions">
              <router-link class="button" :to="{ name: 'notifications' }">
                {{ t('buttons.back') }}
              </router-link>
            </div>
          </div>
        </div>
      </nav>

      <div v-else class="field form-actions">
        <router-link class="button" :to="{ name: 'notifications' }">
          {{ t('buttons.back') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.columns {
  margin: 0 auto;
  max-width: 1344px;
}

.inbox-details {
  width: 100%;
}

.inbox-meta {
  align-items: center;
  color: #7a7a7a;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.inbox-body {
  white-space: pre-wrap;
}

.inbox-related,
.inbox-data {
  margin-top: 1rem;
}

.inbox-related-row {
  margin-bottom: 0.25rem;
}

.inbox-related-key {
  color: #7a7a7a;
  margin-right: 0.35rem;
}

.inbox-data-json {
  overflow-x: auto;
}
</style>
