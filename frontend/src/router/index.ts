import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { setupRouterGuard } from './guard';
import type { App } from 'vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export function setupRouter(app: App) {
  app.use(router);
  setupRouterGuard(router);
}

export default router;
