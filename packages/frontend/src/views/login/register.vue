<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, NAlert } from 'naive-ui';
import { register } from '@/api/auth';

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);

function validate(): string {
  if (!username.value || !password.value) {
    return '请输入用户名和密码';
  }
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username.value)) {
    return '用户名需为 3~32 位字母、数字、下划线或连字符';
  }
  if (password.value.length < 6 || password.value.length > 64) {
    return '密码长度需在 6~64 个字符之间';
  }
  if (password.value !== confirmPassword.value) {
    return '两次输入的密码不一致';
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
  successMessage.value = '';

  try {
    await register(username.value, password.value);
    successMessage.value = `用户 ${username.value} 创建成功`;
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || error.message || '创建失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex items-start justify-center px-4 py-10">
    <NCard
      title="创建账号"
      class="max-w-md w-full shadow-xl rounded-2xl border-none bg-base"
    >
      <p class="text-sm text-gray-500 mb-6">
        仅已登录的管理员可以创建新用户，新用户使用此处设置的账号密码登录。
      </p>
      <NForm size="large">
        <NFormItem label="用户名">
          <NInput
            v-model:value="username"
            placeholder="3~32 位字母、数字、下划线或连字符"
            :maxlength="32"
          />
        </NFormItem>
        <NFormItem label="密码">
          <NInput
            v-model:value="password"
            type="password"
            placeholder="6~64 个字符"
            show-password-on="mousedown"
            @keyup.enter="handleSubmit"
          />
        </NFormItem>
        <NFormItem label="确认密码">
          <NInput
            v-model:value="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password-on="mousedown"
            @keyup.enter="handleSubmit"
          />
        </NFormItem>
        <NFormItem>
          <NButton
            type="primary"
            block
            :loading="loading"
            @click="handleSubmit"
          >
            {{ loading ? '创建中...' : '创建用户' }}
          </NButton>
        </NFormItem>

        <NAlert
          v-if="errorMessage"
          type="error"
          closable
          class="mb-2"
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </NAlert>
        <NAlert
          v-if="successMessage"
          type="success"
          closable
          @close="successMessage = ''"
        >
          {{ successMessage }}
        </NAlert>
      </NForm>
    </NCard>
  </div>
</template>
