<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  useMessage,
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NProgress,
  NEmpty,
  NButton,
  NIcon,
  NSpin,
} from 'naive-ui';
import { RefreshOutline, PieChartOutline } from '@vicons/ionicons5';
import { getUsageStats, type UsageStatsResult } from '@/api/files';
import { formatSize } from '@/utils/format';

defineOptions({
  name: 'storage-stats',
});

const message = useMessage();
const loading = ref(false);
const stats = ref<UsageStatsResult | null>(null);

/** 各类别用量占比（相对全局总量，避免单根目录占比过小而不可见） */
function percentOf(size: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((size / total) * 1000) / 10;
}

async function loadStats() {
  loading.value = true;
  try {
    stats.value = await getUsageStats();
  } catch {
    message.error('加载存储统计失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadStats);
</script>

<template>
  <main class="px-4 md:px-6 pb-4">
    <div
      class="flex items-center justify-between py-4 mb-4 sticky top-0 z-2 bg-container/95 backdrop-blur border-b border-base shadow-sm -mx-4 md:-mx-6 px-4 md:px-6"
    >
      <div class="flex items-center gap-2">
        <NIcon size="22" class="text-primary">
          <PieChartOutline />
        </NIcon>
        <h2 class="text-xl font-semibold text-base">存储统计</h2>
      </div>
      <NButton
        quaternary
        circle
        title="刷新"
        :loading="loading"
        @click="loadStats"
      >
        <template #icon>
          <NIcon><RefreshOutline /></NIcon>
        </template>
      </NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="stats" class="flex flex-col gap-4">
        <NGrid :cols="2" :x-gap="12" :y-gap="12" responsive="screen">
          <NGridItem>
            <NCard size="small">
              <NStatistic label="总占用空间">
                {{ formatSize(stats.totalSize) }}
              </NStatistic>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small">
              <NStatistic label="文件总数" :value="stats.fileCount" />
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard
          v-for="root in stats.roots"
          :key="root.rootId"
          :title="root.rootName"
          size="small"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-sm text-gray-500 shrink-0 w-40">
              {{ formatSize(root.totalSize) }} · {{ root.fileCount }} 个文件
            </span>
            <NProgress
              type="line"
              :percentage="percentOf(root.totalSize, stats.totalSize)"
              :height="10"
              border-radius="5px"
            />
          </div>
          <div
            v-for="cat in root.categories"
            :key="cat.category"
            class="flex items-center gap-3 py-1.5 border-t border-base first:border-t-0"
          >
            <span
              class="text-sm text-base truncate w-48 shrink-0"
              :title="cat.category"
            >
              {{ cat.category }}
            </span>
            <span class="text-xs text-gray-500 shrink-0 w-40">
              {{ formatSize(cat.totalSize) }} · {{ cat.fileCount }} 个文件
            </span>
            <NProgress
              type="line"
              :percentage="percentOf(cat.totalSize, stats.totalSize)"
              :height="6"
              border-radius="3px"
              :show-indicator="false"
            />
          </div>
          <NEmpty
            v-if="root.categories.length === 0"
            description="暂无文件"
            size="small"
            class="py-4"
          />
        </NCard>
      </div>
      <NEmpty v-else-if="!loading" description="暂无统计数据" class="py-16" />
    </NSpin>
  </main>
</template>
