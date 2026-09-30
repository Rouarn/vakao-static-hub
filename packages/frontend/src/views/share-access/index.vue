<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { NIcon, NButton, NSpin, NEmpty, NInput } from 'naive-ui';
import {
  DocumentOutline,
  DownloadOutline,
  LinkOutline,
  LockClosedOutline,
} from '@vicons/ionicons5';
import {
  getShareInfo,
  verifySharePassword,
  getShareFileUrl,
} from '@/api/share';

defineOptions({ name: 'share-access' });

const route = useRoute();

const loading = ref(true);
const verifying = ref(false);
const error = ref('');
const shareType = ref<'file' | 'collection'>('file');
const category = ref('');
const files = ref<string[]>([]);
const hasPassword = ref(false);
const password = ref('');
const accessToken = ref('');
const token = computed(() => route.params.token as string);

const shareUrl = computed(() => {
  return getShareFileUrl(token.value, accessToken.value || undefined);
});

function getFileDownloadUrl(index: number) {
  const url = getShareFileUrl(token.value, accessToken.value || undefined);
  return `${url}${url.includes('?') ? '&' : '?'}index=${index}&download=1`;
}

function downloadFile(index: number) {
  const url = getFileDownloadUrl(index);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function loadShareInfo() {
  loading.value = true;
  error.value = '';
  try {
    const info = await getShareInfo(token.value);
    hasPassword.value = info.hasPassword;
    shareType.value = info.shareType;
    category.value = info.category || '';
    files.value = info.filePaths || [];

    if (!info.hasPassword) {
      // 无密码直接访问
      await accessShare();
    }
  } catch (e: any) {
    error.value = e.message || '加载分享信息失败';
  } finally {
    loading.value = false;
  }
}

async function verifyPassword() {
  if (!password.value) return;
  verifying.value = true;
  error.value = '';
  try {
    const res = await verifySharePassword(token.value, password.value);
    accessToken.value = res.accessToken;
    await accessShare();
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || '密码验证失败';
  } finally {
    verifying.value = false;
  }
}

async function accessShare() {
  if (shareType.value === 'file') {
    // 单文件直接跳转预览/下载
    window.location.href = shareUrl.value;
  }
}

onMounted(() => {
  loadShareInfo();
});
</script>

<template>
  <div
    class="min-h-screen bg-base flex flex-col items-center justify-center p-6"
  >
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <NIcon size="48" class="text-primary mb-3 block mx-auto">
          <LinkOutline />
        </NIcon>
        <h1 class="text-xl font-semibold text-base mb-1">文件分享</h1>
        <p v-if="category" class="text-sm text-gray-500">{{ category }}</p>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <NEmpty :description="error" />
      </div>

      <!-- 需要密码验证 -->
      <template v-else-if="hasPassword && !accessToken">
        <div
          class="bg-container rounded-xl shadow-sm border border-base p-6 space-y-4"
        >
          <div class="flex items-center gap-2 text-base">
            <NIcon size="20" class="text-primary"><LockClosedOutline /></NIcon>
            <span>该分享受密码保护</span>
          </div>
          <NInput
            v-model:value="password"
            type="password"
            placeholder="请输入访问密码"
            size="large"
            @keydown.enter="verifyPassword"
          />
          <NButton
            type="primary"
            size="large"
            block
            :loading="verifying"
            @click="verifyPassword"
          >
            验证密码
          </NButton>
        </div>
      </template>

      <template v-else-if="shareType === 'collection'">
        <div
          class="bg-container rounded-xl shadow-sm border border-base overflow-hidden"
        >
          <div
            v-for="(filePath, index) in files"
            :key="filePath"
            class="flex items-center gap-3 px-4 py-3 border-b border-base last:border-b-0 hover:bg-base/50 transition-colors"
          >
            <NIcon size="20" class="text-gray-400 shrink-0">
              <DocumentOutline />
            </NIcon>
            <span class="flex-1 text-sm text-base truncate" :title="filePath">
              {{ filePath }}
            </span>
            <NButton
              size="small"
              type="primary"
              ghost
              @click="downloadFile(index)"
            >
              <template #icon>
                <NIcon><DownloadOutline /></NIcon>
              </template>
              下载
            </NButton>
          </div>
        </div>
        <div class="mt-4 text-center text-xs text-gray-400">
          共 {{ files.length }} 个文件
        </div>
      </template>

      <div v-else class="text-center py-8 text-sm text-gray-500">
        正在跳转下载...
      </div>
    </div>
  </div>
</template>
