<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import MenuItems from '@/components/MenuItems.vue';
import NotificationsMenu from '@/components/NotificationsMenu.vue';

const NAVBAR_DESKTOP_QUERY = '(min-width: 1024px)';

const { t } = useI18n();
const active = ref(false);
const authStore = useAuthStore();
let desktopNavQuery: MediaQueryList | undefined;

const menuClick = () => {
  active.value = !active.value;
};

const closeMenu = () => {
  active.value = false;
};

function onNavBreakpointChange() {
  closeMenu();
}

onMounted(() => {
  desktopNavQuery = window.matchMedia(NAVBAR_DESKTOP_QUERY);
  desktopNavQuery.addEventListener('change', onNavBreakpointChange);
});

onUnmounted(() => {
  desktopNavQuery?.removeEventListener('change', onNavBreakpointChange);
});
</script>

<template>
  <nav class="navbar is-fixed-top is-primary">
    <div class="container">
      <div class="navbar-brand">
        <a href="/" class="navbar-item has-text-weight-bold">
          <img src="../assets/money.png" />
          {{ t('appName') }}
        </a>

        <LocaleSwitcher />

        <template v-if="authStore.isAuthenticated">
          <NotificationsMenu in-brand :close-menu="closeMenu" />
          <span class="navbar-burger burger" data-target="navMenu" :class="{ 'is-active': active }" @click="menuClick">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </template>
      </div>

      <MenuItems v-if="authStore.isAuthenticated" :active="active" :close-menu="closeMenu" />
    </div>
  </nav>
</template>

<style scoped>
a img {
  margin-right: 5px;
}

.navbar-burger {
  margin-left: 0;
}
</style>
