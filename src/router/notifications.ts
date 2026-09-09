import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import Notifications from '@/pages/notifications/Index.vue';
import NotificationsShow from '@/pages/notifications/Show.vue';

const notificationsRoutes: RouteRecordRaw[] = [
  {
    path: '/notifications',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'notifications',
        component: Notifications,
      },
      {
        path: ':id',
        name: 'notificationsShow',
        component: NotificationsShow,
      },
    ],
  },
];

export default notificationsRoutes;
