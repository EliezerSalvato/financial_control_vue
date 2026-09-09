import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import Institutions from '@/pages/institutions/Index.vue';
import InstitutionsEdit from '@/pages/institutions/Edit.vue';
import InstitutionsNew from '@/pages/institutions/New.vue';

const institutionsRoutes: RouteRecordRaw[] = [
  {
    path: '/institutions',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'institutions',
        component: Institutions,
      },
      {
        path: 'new',
        name: 'institutionsNew',
        component: InstitutionsNew,
      },
      {
        path: 'edit/:id',
        name: 'institutionsEdit',
        component: InstitutionsEdit,
      },
    ],
  },
];

export default institutionsRoutes;
