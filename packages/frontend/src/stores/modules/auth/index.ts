import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 认证状态管理 Store
 * 管理用户登录状态和 AccessToken
 * 使用 pinia-plugin-persistedstate 实现持久化
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref('');
    const isLoggedIn = computed(() => accessToken.value !== '');

    /**
     * 设置访问令牌
     */
    function setAccessToken(token: string) {
      accessToken.value = token;
    }

    /**
     * 清除认证信息（登出）
     */
    function clearAuth() {
      accessToken.value = '';
    }

    return {
      isLoggedIn,
      accessToken,
      setAccessToken,
      clearAuth,
    };
  },
  {
    persist: true, // 开启持久化存储
  },
);
