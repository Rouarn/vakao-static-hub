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
    path: '/share/:token',
    name: 'share-access',
    component: () => import('@/views/share-access/index.vue'),
    meta: { requiresAuth: false },
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
    path: 'app-update',
    name: 'app-update',
    component: () => import('@/views/app-update/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'app-update-stats',
    name: 'app-update-stats',
    component: () => import('@/views/app-update/stats.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'storage-stats',
    name: 'storage-stats',
    component: () => import('@/views/storage-stats/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'duplicate-files',
    name: 'duplicate-files',
    component: () => import('@/views/duplicate-files/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'user-management',
    name: 'user-management',
    component: () => import('@/views/user-management/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'audit-logs',
    name: 'audit-logs',
    component: () => import('@/views/audit-logs/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'system-status',
    name: 'system-status',
    component: () => import('@/views/system-status/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'local-file-preview',
    name: 'local-file-preview',
    component: () => import('@/views/file-preview/index.vue'),
    meta: { requiresAuth: true },
  },
];
