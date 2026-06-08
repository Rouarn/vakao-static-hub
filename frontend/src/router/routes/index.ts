import type { RouteRecordRaw } from 'vue-router';
import BaseLayout from '@/layouts/base-layout/index.vue';
import { builtinRoutes, builtinChildren } from './builtin';

export const routes: RouteRecordRaw[] = [
  ...builtinRoutes,
  {
    path: '/',
    component: BaseLayout,
    redirect: '/file-list',
    meta: { requiresAuth: true },
    children: builtinChildren,
  },
];
