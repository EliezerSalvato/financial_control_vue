import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import Accounts from '@/pages/accounts/Index.vue';
import AccountsEdit from '@/pages/accounts/Edit.vue';
import AccountsNew from '@/pages/accounts/New.vue';

const accountsRoutes: RouteRecordRaw[] = [
  {
    path: '/accounts',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'accounts',
        component: Accounts,
      },
      {
        path: 'new',
        name: 'accountsNew',
        component: AccountsNew,
      },
      {
        path: 'edit/:id',
        name: 'accountsEdit',
        component: AccountsEdit,
      },
    ],
  },
];

export default accountsRoutes;
