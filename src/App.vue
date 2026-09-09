<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useInboxNotificationsChannel } from '@/composables/useInboxNotificationsChannel';
import { useProfileLocaleSync } from '@/composables/useProfileLocaleSync';
import Footer from '@/components/Footer.vue';
import Menu from '@/components/Menu.vue';

useProfileLocaleSync();
useInboxNotificationsChannel();
</script>

<template>
  <Menu />

  <main>
    <transition mode="out-in">
      <RouterView />
    </transition>
  </main>

  <Footer />
</template>

<style>
main {
  margin-top: 10px;
  margin-bottom: 10px;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.v-enter {
  transform: translate3d(0, -20px, 0);
}

.v-leave-to {
  transform: translate3d(0, 20px, 0);
}

.v-enter-active,
.v-leave-active {
  transition: all 0.3s;
}
</style>
