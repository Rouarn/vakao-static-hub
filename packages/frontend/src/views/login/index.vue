<script setup lang="ts">
import { computed, ref } from 'vue';
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
import { login, register } from '@/api/auth';

type Mode = 'login' | 'register';

const mode = ref<Mode>('login');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isRegister = computed(() => mode.value === 'register');
const submitText = computed(() => {
  if (loading.value) return isRegister.value ? '注册中...' : '登录中...';
  return isRegister.value ? '注册并登录' : '登录系统';
});

function switchMode(next: Mode) {
  if (mode.value === next) return;
  mode.value = next;
  errorMessage.value = '';
  confirmPassword.value = '';
  if (next === 'register') {
    username.value = '';
    password.value = '';
  }
}

function validate(): string {
  if (!username.value || !password.value) {
    return '请输入用户名和密码';
  }
  if (isRegister.value) {
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username.value)) {
      return '用户名需为 3~32 位字母、数字、下划线或连字符';
    }
    if (password.value.length < 6 || password.value.length > 64) {
      return '密码长度需在 6~64 个字符之间';
    }
    if (password.value !== confirmPassword.value) {
      return '两次输入的密码不一致';
    }
  }
  return '';
}

async function handleSubmit() {
  const validationError = validate();
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const data = isRegister.value
      ? await register(username.value, password.value)
      : await login(username.value, password.value);
    authStore.setAuth(data.accessToken, data.user);
    const redirect = (route.query.redirect as string) || '/file-list';
    await router.replace(redirect);
  } catch (error: any) {
    authStore.clearAuth();
    errorMessage.value =
      error.response?.data?.message || error.message || '请求失败，请稍后重试';
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

      <NForm size="large" @keyup.enter="handleSubmit">
        <NFormItem label="用户名">
          <NInput
            v-model:value="username"
            placeholder="请输入用户名"
            :maxlength="32"
          />
        </NFormItem>
        <NFormItem label="密码">
          <NInput
            v-model:value="password"
            type="password"
            placeholder="请输入密码"
            show-password-on="mousedown"
          />
        </NFormItem>
        <NFormItem v-if="isRegister" label="确认密码">
          <NInput
            v-model:value="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password-on="mousedown"
          />
        </NFormItem>
        <NFormItem>
          <NButton
            id="submitBtn"
            type="primary"
            block
            :loading="loading"
            @click="handleSubmit"
          >
            {{ submitText }}
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

        <div class="w-full text-center text-sm text-gray-500 mt-2">
          <template v-if="isRegister">
            已有账号？
            <NButton text type="primary" @click="switchMode('login')">
              返回登录
            </NButton>
          </template>
          <template v-else>
            还没有账号？
            <NButton text type="primary" @click="switchMode('register')">
              立即注册
            </NButton>
          </template>
        </div>
      </NForm>
    </NCard>
  </div>
</template>
