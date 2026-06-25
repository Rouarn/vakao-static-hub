<script setup lang="ts">
/**
 * 分享链接管理页面
 * 展示所有分享链接，支持复制链接和撤销操作
 */
import { ref, onMounted, computed } from 'vue';
import {
  useMessage,
  NDataTable,
  NButton,
  NIcon,
  NPopconfirm,
  NSpace,
  NTag,
  NInput,
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { h } from 'vue';
import {
  LinkOutline,
  CopyOutline,
  TrashOutline,
  RefreshOutline,
  TimeOutline,
} from '@vicons/ionicons5';
import {
  getShareLinks,
  revokeShareLink,
  getShareLinkUrl,
  type ShareLink,
} from '@/service/api/share';

defineOptions({
  name: 'share-links',
});

const message = useMessage();
const loading = ref(false);
const shareLinks = ref<ShareLink[]>([]);
const searchText = ref('');

const filteredLinks = computed(() => {
  if (!searchText.value) return shareLinks.value;
  const q = searchText.value.toLowerCase();
  return shareLinks.value.filter(
    (link) =>
      link.filePath.toLowerCase().includes(q) ||
      link.category.toLowerCase().includes(q) ||
      link.token.toLowerCase().includes(q),
  );
});

async function loadShareLinks() {
  loading.value = true;
  try {
    const { data } = await getShareLinks();
    shareLinks.value = data.data || [];
  } catch {
    message.error('加载分享链接失败');
  } finally {
    loading.value = false;
  }
}

function copyLink(token: string) {
  const url = getShareLinkUrl(token);
  navigator.clipboard.writeText(url).then(
    () => message.success('链接已复制到剪贴板'),
    () => message.error('复制失败'),
  );
}

async function handleRevoke(token: string) {
  try {
    await revokeShareLink(token);
    message.success('已撤销');
    await loadShareLinks();
  } catch {
    message.error('撤销失败');
  }
}

function formatTime(ts: number | null) {
  if (!ts) return '永不过期';
  const date = new Date(ts);
  const now = new Date();
  if (date < now) return '已过期';
  return date.toLocaleString();
}

function formatExpireStatus(
  ts: number | null,
  maxAccesses: number | null,
  accessCount: number,
) {
  if (ts && ts < Date.now()) return { text: '已过期', type: 'error' as const };
  if (maxAccesses && accessCount >= maxAccesses)
    return { text: '已达上限', type: 'warning' as const };
  return { text: '有效', type: 'success' as const };
}

const columns = computed<DataTableColumns<ShareLink>>(() => [
  {
    title: '文件',
    key: 'filePath',
    ellipsis: { tooltip: true },
    render(row) {
      return h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'text-sm font-medium truncate max-w-[400px]' },
          row.filePath,
        ),
        h('span', { class: 'text-xs text-gray-400' }, row.category),
      ]);
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const status = formatExpireStatus(
        row.expiresAt,
        row.maxAccesses,
        row.accessCount,
      );
      return h(
        NTag,
        { type: status.type, size: 'small', round: true },
        () => status.text,
      );
    },
  },
  {
    title: '过期时间',
    key: 'expiresAt',
    width: 180,
    render(row) {
      return h(
        'div',
        { class: 'flex items-center gap-1 text-sm text-gray-500' },
        [
          h(NIcon, { size: 14 }, () => h(TimeOutline)),
          formatTime(row.expiresAt),
        ],
      );
    },
  },
  {
    title: '访问次数',
    key: 'accessCount',
    width: 120,
    render(row) {
      const limit = row.maxAccesses
        ? `${row.accessCount} / ${row.maxAccesses}`
        : `${row.accessCount} / ∞`;
      return h('span', { class: 'text-sm' }, limit);
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render(row) {
      return new Date(row.createdAt).toLocaleString();
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    fixed: 'right',
    render(row) {
      return h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => copyLink(row.token),
          },
          {
            icon: () => h(NIcon, null, () => h(CopyOutline)),
            default: () => '复制',
          },
        ),
        h(
          NPopconfirm,
          {
            'positive-text': '撤销',
            'negative-text': '取消',
            onPositiveClick: () => handleRevoke(row.token),
          },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', quaternary: true, type: 'error' },
                {
                  icon: () => h(NIcon, null, () => h(TrashOutline)),
                  default: () => '撤销',
                },
              ),
            default: () => '确定要撤销此分享链接吗？',
          },
        ),
      ]);
    },
  },
]);

onMounted(() => {
  loadShareLinks();
});
</script>

<template>
  <main class="px-4 md:px-6 pb-4">
    <div
      class="flex flex-col md:flex-row items-start md:items-center justify-between py-4 mb-4 sticky top-0 z-2 bg-container/95 backdrop-blur supports-[backdrop-filter]:bg-container/80 border-b border-base shadow-sm -mx-4 md:-mx-6 px-4 md:px-6 gap-4 md:gap-0"
    >
      <div>
        <h2
          class="text-xl font-semibold mb-1 text-base flex items-center gap-2"
        >
          <NIcon :component="LinkOutline" />
          分享链接管理
        </h2>
        <span class="text-xs text-gray-500">
          {{ filteredLinks.length }} 个链接
        </span>
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto">
        <NInput
          v-model:value="searchText"
          placeholder="搜索文件或链接..."
          size="small"
          clearable
          class="w-full md:w-50"
        />
        <NButton size="small" @click="loadShareLinks" :loading="loading">
          <template #icon>
            <NIcon :component="RefreshOutline" />
          </template>
        </NButton>
      </div>
    </div>

    <div
      v-if="filteredLinks.length === 0 && !loading"
      class="text-center py-16 text-gray-400"
    >
      <NIcon class="text-5xl mb-4 block mx-auto" :component="LinkOutline" />
      <p>暂无分享链接</p>
    </div>

    <NDataTable
      v-else
      :columns="columns"
      :data="filteredLinks"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      :scroll-x="900"
      class="rounded-xl shadow-sm"
    />
  </main>
</template>
