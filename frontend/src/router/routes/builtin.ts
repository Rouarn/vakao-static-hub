import type { RouteRecordRaw } from 'vue-router';

export const builtinRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/file-preview',
    name: 'file-preview',
    component: () => import('@/views/file-preview/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/file-list',
  },
];

export const builtinChildren: RouteRecordRaw[] = [
  {
    path: 'file-list',
    name: 'file-list',
    component: () => import('@/views/file-list/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'share-links',
    name: 'share-links',
    component: () => import('@/views/share-links/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'api-docs',
    name: 'api-docs',
    component: () => import('@/views/api-docs/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'placeholder-generator',
    name: 'placeholder-generator',
    component: () => import('@/views/placeholder/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'hitokoto',
    name: 'hitokoto',
    component: () => import('@/views/hitokoto/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'local-file-preview',
    name: 'local-file-preview',
    component: () => import('@/views/file-preview/index.vue'),
    meta: { requiresAuth: true },
  },
];
