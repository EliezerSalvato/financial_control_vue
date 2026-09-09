import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import Transactions from '@/pages/transactions/Index.vue';
import TransactionsEdit from '@/pages/transactions/Edit.vue';
import TransactionsNew from '@/pages/transactions/New.vue';

const transactionsRoutes: RouteRecordRaw[] = [
  {
    path: '/transactions',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'transactions',
        component: Transactions,
      },
      {
        path: 'new',
        name: 'transactionsNew',
        component: TransactionsNew,
      },
      {
        path: 'edit/:id',
        name: 'transactionsEdit',
        component: TransactionsEdit,
      },
    ],
  },
];

export default transactionsRoutes;
