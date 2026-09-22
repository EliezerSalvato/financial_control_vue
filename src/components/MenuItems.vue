<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import { RouterLink, useRouter } from 'vue-router';
import NotificationsMenu from '@/components/NotificationsMenu.vue';

defineProps<{
  active: boolean;
  closeMenu: () => void;
}>();

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();

async function onLogout() {
  try {
    await authStore.logout();
  } finally {
    await router.push({ name: 'signIn' });
  }
}
</script>

<template>
  <div id="navMenu" class="navbar-menu" :class="{ 'is-active': active }">
    <div class="navbar-end" @click="closeMenu">
      <RouterLink class="navbar-item" active-class="is-active" to="/">
        {{ t('menu.monthlyStatement') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/goals">
        {{ t('menu.goals') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/transactions">
        {{ t('menu.transactions') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/credit-cards">
        {{ t('menu.creditCards') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/accounts">
        {{ t('menu.accounts') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/institutions">
        {{ t('menu.institutions') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/categories">
        {{ t('menu.categories') }}
      </RouterLink>
      <RouterLink class="navbar-item" active-class="is-active" to="/tags">
        {{ t('menu.tags') }}
      </RouterLink>
      <NotificationsMenu :close-menu="closeMenu" />
      <RouterLink class="navbar-item" active-class="is-active" to="/users/profile" :title="`${userStore.user?.fullName}`">
        <span class="icon is-hidden-touch">
          <i class="fas fa-user"></i>
        </span>
        <span class="is-hidden-desktop">{{ t('menu.profile') }}</span>
      </RouterLink>
      <a href="#" class="navbar-item" :title="t('menu.logout')" @click.prevent="onLogout">
        <span class="icon is-hidden-touch">
          <i class="fas fa-sign-out-alt"></i>
        </span>
        <span class="is-hidden-desktop">{{ t('menu.logout') }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
a img {
  margin-right: 5px;
}
</style>
