import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { createRouter, createWebHistory } from 'vue-router';
import MonthlyStatements from '@/pages/monthly_statements/Index.vue';
import NotFound from '@/pages/NotFound.vue';
import accountsRoutes from '@/router/accounts';
import categoriesRoutes from '@/router/categories';
import creditCardsRoutes from '@/router/credit_cards';
import institutionsRoutes from '@/router/institutions';
import notificationsRoutes from '@/router/notifications';
import tagsRoutes from '@/router/tags';
import transactionsRoutes from '@/router/transactions';
import usersRoutes from '@/router/users';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'monthly_statement',
      component: MonthlyStatements,
      meta: { requiresAuth: true },
    },
    ...transactionsRoutes,
    ...creditCardsRoutes,
    ...accountsRoutes,
    ...institutionsRoutes,
    ...categoriesRoutes,
    ...tagsRoutes,
    ...notificationsRoutes,
    ...usersRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFound,
    },
  ],
});

let sessionRestorePromise: Promise<void> | null = null;

function restoreSession() {
  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    return Promise.resolve();
  }

  if (!sessionRestorePromise) {
    sessionRestorePromise = authStore
      .refreshToken()
      .catch(() => {})
      .finally(() => {
        sessionRestorePromise = null;
      });
  }

  return sessionRestorePromise;
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();

  notificationStore.setCurrentMessage('');

  if (!authStore.isAuthenticated) {
    await restoreSession();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'signIn', query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'monthly_statement' };
  }
});

export default router;
