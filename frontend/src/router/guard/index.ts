import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/modules/auth';

export function setupRouterGuard(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore();
    const isLoggedIn = authStore.isLoggedIn;

    // 访问登录页时，如果已登录则跳转到首页
    if (to.name === 'login') {
      if (isLoggedIn) {
        return { name: 'file-list' };
      }
      return;
    }

    // 访问需要认证的页面时，未登录则跳转到登录页
    if (to.meta.requiresAuth !== false) {
      if (!isLoggedIn) {
        return { name: 'login', query: { redirect: to.fullPath } };
      }
    }
  });
}
