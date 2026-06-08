<script setup lang="ts">
/**
 * 登录视图
 * 处理用户登录逻辑，包含表单验证和 API 调用
 */
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NIcon,
} from 'naive-ui';
import { CloudOutline } from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/modules/auth';
import { login } from '@/service/api/auth';

const username = ref('admin');
const password = ref('admin');
const errorMessage = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await login(username.value, password.value);
    authStore.setAccessToken(res.data.data.accessToken);
    const redirect = (route.query.redirect as string) || '/file-list';
    await router.replace(redirect);
  } catch (error: any) {
    authStore.clearAuth();
    errorMessage.value =
      error.response?.data?.message || error.message || '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-container px-4">
    <NCard class="max-w-md w-full shadow-xl rounded-2xl border-none bg-base">
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4"
        >
          <NIcon size="40" class="text-primary">
            <CloudOutline />
          </NIcon>
        </div>
        <h1 class="text-2xl font-bold text-base">StaticHub</h1>
        <p class="text-sm text-gray-500 mt-1">静态资源管理系统</p>
      </div>

      <NForm size="large">
        <NFormItem label="用户名">
          <NInput v-model:value="username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="密码">
          <NInput
            v-model:value="password"
            type="password"
            placeholder="请输入密码"
            show-password-on="mousedown"
            @keyup.enter="handleLogin"
          />
        </NFormItem>
        <!-- 登录按钮 -->
        <NFormItem>
          <NButton
            id="loginBtn"
            type="primary"
            block
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录系统' }}
          </NButton>
        </NFormItem>

        <NAlert
          v-if="errorMessage"
          type="error"
          closable
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </NAlert>
      </NForm>
    </NCard>
  </div>
</template>
