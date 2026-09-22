import type { RouteRecordRaw } from 'vue-router';
import Goals from '@/pages/goals/Index.vue';

const goalsRoutes: RouteRecordRaw[] = [
  {
    path: '/goals',
    name: 'goals',
    component: Goals,
    meta: { requiresAuth: true },
  },
];

export default goalsRoutes;
