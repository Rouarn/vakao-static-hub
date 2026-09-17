import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { UserInfo } from '@vakao/shared';

/**
 * 认证状态管理 Store
 * 管理用户登录状态、AccessToken 与当前用户信息
 * 使用 pinia-plugin-persistedstate 实现持久化
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref('');
    const userInfo = ref<UserInfo | null>(null);
    const isLoggedIn = computed(() => accessToken.value !== '');
    const username = computed(() => userInfo.value?.username ?? '');

    /**
     * 保存登录态（令牌 + 用户信息）
     */
    function setAuth(token: string, user: UserInfo) {
      accessToken.value = token;
      userInfo.value = user;
    }

    /**
     * 清除认证信息（登出）
     */
    function clearAuth() {
      accessToken.value = '';
      userInfo.value = null;
    }

    return {
      isLoggedIn,
      accessToken,
      userInfo,
      username,
      setAuth,
      clearAuth,
    };
  },
  {
    persist: true, // 开启持久化存储
  },
);
