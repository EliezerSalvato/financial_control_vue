import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import Categories from '@/pages/categories/Index.vue';
import CategoriesEdit from '@/pages/categories/Edit.vue';
import CategoriesNew from '@/pages/categories/New.vue';

const categoriesRoutes: RouteRecordRaw[] = [
  {
    path: '/categories',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'categories',
        component: Categories,
      },
      {
        path: 'new',
        name: 'categoriesNew',
        component: CategoriesNew,
      },
      {
        path: 'edit/:id',
        name: 'categoriesEdit',
        component: CategoriesEdit,
      },
    ],
  },
];

export default categoriesRoutes;
