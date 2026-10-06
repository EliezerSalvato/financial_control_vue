import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import ImportRules from '@/pages/import_rules/Index.vue';
import ImportRulesEdit from '@/pages/import_rules/Edit.vue';
import ImportRulesNew from '@/pages/import_rules/New.vue';

const importRulesRoutes: RouteRecordRaw[] = [
  {
    path: '/import-rules',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'importRules',
        component: ImportRules,
      },
      {
        path: 'new',
        name: 'importRulesNew',
        component: ImportRulesNew,
      },
      {
        path: 'edit/:id',
        name: 'importRulesEdit',
        component: ImportRulesEdit,
      },
    ],
  },
];

export default importRulesRoutes;
