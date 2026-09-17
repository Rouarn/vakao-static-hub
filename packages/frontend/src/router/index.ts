import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import BaseLayout from '@/layouts/base-layout.vue';
import { builtinRoutes, builtinChildren } from './routes';
import { setupRouterGuard } from './guard';
import type { App } from 'vue';

const routes: RouteRecordRaw[] = [
  ...builtinRoutes,
  {
    path: '/',
    component: BaseLayout,
    redirect: '/file-list',
    meta: { requiresAuth: true },
    children: builtinChildren,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/file-list',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export function setupRouter(app: App) {
  app.use(router);
  setupRouterGuard(router);
}

export default router;
