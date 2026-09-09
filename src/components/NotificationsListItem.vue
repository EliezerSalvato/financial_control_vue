<script setup lang="ts">
import type { InboxNotification } from '@/types/inbox_notification';
import { useAppLocale } from '@/composables/useAppLocale';
import { formatFrontDateTime } from '@/locales/locale';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  item: InboxNotification;
}>();

const emit = defineEmits<{
  select: [];
}>();

const { appLocale } = useAppLocale();
const createdAtLabel = computed(() => formatFrontDateTime(props.item.createdAt, appLocale.value));
</script>

<template>
  <RouterLink
    class="inbox-item"
    :class="{ 'is-unread': !item.read }"
    :to="{ name: 'notificationsShow', params: { id: item.id } }"
    @click="emit('select')"
  >
    <span class="inbox-item-marker" aria-hidden="true"></span>
    <span class="inbox-item-body">
      <strong class="inbox-item-title">{{ item.title }}</strong>
      <span v-if="item.body" class="inbox-item-message">{{ item.body }}</span>
      <time class="inbox-item-date" :datetime="item.createdAt">{{ createdAtLabel }}</time>
    </span>
  </RouterLink>
</template>

<style scoped>
.inbox-item {
  align-items: flex-start;
  border-bottom: 1px solid #ededed;
  color: inherit;
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  width: 100%;
}

.inbox-item:last-child {
  border-bottom: none;
}

.inbox-item:hover {
  background-color: #f5f5f5;
}

.inbox-item.is-unread {
  background-color: #f6fffd;
}

.inbox-item.is-unread:hover {
  background-color: #eefaf7;
}

.inbox-item-marker {
  background-color: transparent;
  border-radius: 50%;
  flex-shrink: 0;
  height: 0.5rem;
  margin-top: 0.45rem;
  width: 0.5rem;
}

.inbox-item.is-unread .inbox-item-marker {
  background-color: #00d1b2;
}

.inbox-item-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.inbox-item-title {
  color: #363636;
  display: -webkit-box;
  font-size: 0.95rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.inbox-item-message {
  color: #4a4a4a;
  display: -webkit-box;
  font-size: 0.85rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.inbox-item-date {
  color: #7a7a7a;
  font-size: 0.75rem;
}
</style>
