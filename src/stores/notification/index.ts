import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationType = 'danger' | 'success';

export const useNotificationStore = defineStore('notification', () => {
  const currentMessage = ref('');
  const currentMessageType = ref<NotificationType>('success');

  function setCurrentMessage(message: string, type?: NotificationType) {
    currentMessage.value = message;

    if (type) {
      currentMessageType.value = type;
    }
  }

  return {
    currentMessage,
    currentMessageType,
    setCurrentMessage,
  };
});
