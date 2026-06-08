import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/modules/auth';

export function setupRouterGuard(router: Router) {
  router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();
    const isLoggedIn = authStore.isLoggedIn;

    // 访问登录页时，如果已登录则跳转到首页
    if (to.name === 'login') {
      if (isLoggedIn) {
        next({ name: 'file-list' });
      } else {
        next();
      }
      return;
    }

    // 访问需要认证的页面时，未登录则跳转到登录页
    if (to.meta.requiresAuth !== false) {
      if (!isLoggedIn) {
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
      }
    }

    next();
  });
}
