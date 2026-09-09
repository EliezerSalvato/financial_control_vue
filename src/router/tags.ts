import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import Tags from '@/pages/tags/Index.vue';
import TagsEdit from '@/pages/tags/Edit.vue';
import TagsNew from '@/pages/tags/New.vue';

const tagsRoutes: RouteRecordRaw[] = [
  {
    path: '/tags',
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'tags',
        component: Tags,
      },
      {
        path: 'new',
        name: 'tagsNew',
        component: TagsNew,
      },
      {
        path: 'edit/:id',
        name: 'tagsEdit',
        component: TagsEdit,
      },
    ],
  },
];

export default tagsRoutes;
