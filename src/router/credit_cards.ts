import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import CreditCards from '@/pages/credit_cards/Index.vue';
import CreditCardsEdit from '@/pages/credit_cards/Edit.vue';
import CreditCardsNew from '@/pages/credit_cards/New.vue';

const creditCardsRoutes: RouteRecordRaw[] = [
  {
    path: '/credit-cards',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'creditCards',
        component: CreditCards,
      },
      {
        path: 'new',
        name: 'creditCardsNew',
        component: CreditCardsNew,
      },
      {
        path: 'edit/:id',
        name: 'creditCardsEdit',
        component: CreditCardsEdit,
      },
    ],
  },
];

export default creditCardsRoutes;
