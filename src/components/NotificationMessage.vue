<script setup lang="ts">
import type { NotificationType } from '@/stores/notification';
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/stores/notification';
import { computed, useSlots } from 'vue';

const props = defineProps<{
  type?: NotificationType;
}>();

const emit = defineEmits<{
  close: [];
}>();

const slots = useSlots();
const notificationStore = useNotificationStore();
const { currentMessage, currentMessageType } = storeToRefs(notificationStore);

const isLocal = computed(() => Boolean(slots.default));
const isVisible = computed(() => isLocal.value || Boolean(currentMessage.value));
const currentType = computed(() => props.type || currentMessageType.value);
const iconType = computed(() => (currentType.value === 'danger' ? 'fa-times' : 'fa-check'));

function close() {
  emit('close');

  if (!isLocal.value) {
    notificationStore.setCurrentMessage('');
  }
}
</script>

<template>
  <div v-if="isVisible" class="notification" :class="`is-${currentType}`">
    <button type="button" class="delete" @click="close"></button>
    <slot>
      <p>
        <i class="fas" :class="iconType"></i>
        {{ currentMessage }}
      </p>
    </slot>
  </div>
</template>
