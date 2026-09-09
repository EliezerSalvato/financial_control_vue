import type { RouteRecordRaw } from 'vue-router';
import ConfirmEmail from '@/pages/user/ConfirmEmail.vue';
import ForgotPassword from '@/pages/user/ForgotPassword.vue';
import Login from '@/pages/user/Login.vue';
import Profile from '@/pages/user/profile/Form.vue';
import Registration from '@/pages/user/Registration.vue';
import ResetPassword from '@/pages/user/ResetPassword.vue';

const usersRoutes: RouteRecordRaw[] = [
  {
    path: '/users/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: '/users/sign-in',
    name: 'signIn',
    component: Login,
    meta: { requiresGuest: true },
  },
  {
    path: '/users/sign-up',
    name: 'signUp',
    component: Registration,
    meta: { requiresGuest: true },
  },
  {
    path: '/users/password/new',
    name: 'forgotPassword',
    component: ForgotPassword,
    meta: { requiresGuest: true },
  },
  {
    path: '/users/password/edit',
    name: 'resetPassword',
    component: ResetPassword,
    meta: { requiresGuest: true },
  },
  {
    path: '/users/confirmation',
    name: 'confirmEmail',
    component: ConfirmEmail,
  },
];

export default usersRoutes;
