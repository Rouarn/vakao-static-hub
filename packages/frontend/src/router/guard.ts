import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/modules/auth';

export function setupRouterGuard(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore();
    const isLoggedIn = authStore.isLoggedIn;

    if (to.name === 'login') {
      if (isLoggedIn) {
        return { name: 'file-list' };
      }
      return;
    }

    if (to.meta.requiresAuth !== false) {
      if (!isLoggedIn) {
        return { name: 'login', query: { redirect: to.fullPath } };
      }
    }
  });
}
