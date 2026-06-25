<script setup lang="ts">
import { ref } from 'vue';
import {
  NModal,
  NButton,
  NSelect,
  NInputGroup,
  NInputGroupLabel,
  NSpace,
  useMessage,
} from 'naive-ui';
import { createShareLink, getShareLinkUrl } from '@/api/share';
import CopyableCode from '@/components/copyable-code.vue';
import { useFileListStore } from '@/stores/modules/file-list';

const props = defineProps<{
  visible: boolean;
  filePath: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const message = useMessage();
const store = useFileListStore();

const loading = ref(false);
const createdToken = ref('');

const expireOptions = [
  { label: '永不过期', value: 0 },
  { label: '1 小时', value: 3600000 },
  { label: '24 小时', value: 86400000 },
  { label: '7 天', value: 604800000 },
  { label: '30 天', value: 2592000000 },
];
const selectedExpire = ref(0);

const accessLimitOptions = [
  { label: '不限制', value: 0 },
  { label: '1 次', value: 1 },
  { label: '5 次', value: 5 },
  { label: '10 次', value: 10 },
  { label: '50 次', value: 50 },
  { label: '100 次', value: 100 },
];
const selectedAccessLimit = ref(0);

function close() {
  createdToken.value = '';
  emit('close');
}

async function handleCreate() {
  loading.value = true;
  try {
    const data = await createShareLink({
      rootId: store.currentRootId,
      category: store.currentCategory,
      filePath: props.filePath,
      expiresInMs: selectedExpire.value || undefined,
      maxAccesses: selectedAccessLimit.value || undefined,
    });
    createdToken.value = data.token;
    message.success('分享链接已创建');
  } catch (error: any) {
    message.error(error.response?.data?.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

function copyLink() {
  const url = getShareLinkUrl(createdToken.value);
  navigator.clipboard.writeText(url).then(
    () => message.success('链接已复制到剪贴板'),
    () => message.error('复制失败'),
  );
}
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    title="创建分享链接"
    :mask-closable="true"
    style="max-width: 480px"
    @update:show="
      (value) => {
        if (!value) close();
      }
    "
  >
    <div class="space-y-4">
      <div class="text-sm text-gray-500 truncate" :title="props.filePath">
        文件：{{ props.filePath }}
      </div>

      <template v-if="!createdToken">
        <div>
          <div class="text-sm font-medium mb-2">过期时间</div>
          <NInputGroup>
            <NInputGroupLabel>有效期</NInputGroupLabel>
            <NSelect v-model:value="selectedExpire" :options="expireOptions" />
          </NInputGroup>
        </div>

        <div>
          <div class="text-sm font-medium mb-2">访问次数限制</div>
          <NInputGroup>
            <NInputGroupLabel>最大次数</NInputGroupLabel>
            <NSelect
              v-model:value="selectedAccessLimit"
              :options="accessLimitOptions"
            />
          </NInputGroup>
        </div>
      </template>

      <template v-else>
        <div class="space-y-3">
          <div class="text-sm text-green-600 font-medium">分享链接已创建</div>
          <CopyableCode
            :code="getShareLinkUrl(createdToken)"
            language="text"
            label="分享链接"
            mode="button"
          />
        </div>
      </template>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="close">{{ createdToken ? '关闭' : '取消' }}</NButton>
        <NButton
          v-if="!createdToken"
          type="primary"
          :loading="loading"
          @click="handleCreate"
        >
          创建链接
        </NButton>
        <NButton v-else type="primary" @click="copyLink"> 复制链接 </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
