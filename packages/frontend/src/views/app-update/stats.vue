<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  useMessage,
  NSelect,
  NButton,
  NIcon,
  NDataTable,
  NEmpty,
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NDatePicker,
} from 'naive-ui';
import {
  RefreshOutline,
  BarChartOutline,
  CloudDownloadOutline,
} from '@vicons/ionicons5';
import { getApps, getFunnelStats, type FunnelStatItem } from '@/api/app-update';

defineOptions({
  name: 'app-update-stats',
});

const message = useMessage();
const route = useRoute();

const apps = ref<string[]>([]);
const selectedApp = ref<string | null>(null);
const appsLoading = ref(false);
const loading = ref(false);
const items = ref<FunnelStatItem[]>([]);
const checkNoUpdateTotal = ref(0);
const timeRange = ref<[number, number] | null>(null);

const appOptions = computed(() =>
  apps.value.map((appKey) => ({ label: appKey, value: appKey })),
);

const totalPromptShow = computed(() =>
  items.value.reduce((sum, item) => sum + item.promptShow, 0),
);
const totalInstallSuccess = computed(() =>
  items.value.reduce((sum, item) => sum + item.installSuccess, 0),
);
const overallSuccessRate = computed(() => {
  const total = totalPromptShow.value;
  if (!total) return '0%';
  return ((totalInstallSuccess.value / total) * 100).toFixed(2) + '%';
});

async function loadApps() {
  appsLoading.value = true;
  try {
    apps.value = await getApps();
    const queryApp = route.query.appKey as string | undefined;
    if (queryApp && apps.value.includes(queryApp)) {
      selectedApp.value = queryApp;
    } else if (apps.value.length > 0 && !selectedApp.value) {
      selectedApp.value = apps.value[0];
    }
    if (selectedApp.value) void loadStats();
  } catch {
    message.error('加载应用列表失败');
  } finally {
    appsLoading.value = false;
  }
}

async function loadStats() {
  if (!selectedApp.value) {
    items.value = [];
    return;
  }
  loading.value = true;
  try {
    const endTime = timeRange.value?.[1] ?? Date.now();
    const startTime =
      timeRange.value?.[0] ?? endTime - 30 * 24 * 60 * 60 * 1000;
    const data = await getFunnelStats({
      appKey: selectedApp.value,
      startTime,
      endTime,
    });
    items.value = data.items;
    checkNoUpdateTotal.value = data.checkNoUpdateTotal;
  } catch {
    message.error('加载漏斗统计失败');
  } finally {
    loading.value = false;
  }
}

function handleAppChange(value: string | null) {
  selectedApp.value = value;
  void loadStats();
}

function handleTimeChange(value: [number, number] | null) {
  timeRange.value = value;
  void loadStats();
}

const columns = [
  {
    title: '目标版本',
    key: 'version',
    width: 140,
    render(row: FunnelStatItem) {
      return `${row.versionName || '-'} (code: ${row.toVersionCode})`;
    },
  },
  { title: '提示更新', key: 'promptShow', width: 90 },
  { title: '开始下载', key: 'downloadStart', width: 90 },
  { title: '下载成功', key: 'downloadSuccess', width: 90 },
  { title: '下载失败', key: 'downloadFail', width: 90 },
  { title: '校验失败', key: 'verifyFail', width: 90 },
  { title: '安装成功', key: 'installSuccess', width: 90 },
  { title: '安装失败', key: 'installFail', width: 90 },
  { title: '新版本启动', key: 'newVersionLaunch', width: 100 },
  {
    title: '下载率',
    key: 'downloadRate',
    width: 90,
    render(row: FunnelStatItem) {
      return row.downloadRate;
    },
  },
  {
    title: '安装率',
    key: 'installRate',
    width: 90,
    render(row: FunnelStatItem) {
      return row.installRate;
    },
  },
  {
    title: '整体转化率',
    key: 'overallRate',
    width: 100,
    render(row: FunnelStatItem) {
      return row.overallRate;
    },
  },
];

onMounted(() => {
  void loadApps();
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
          <NIcon :component="BarChartOutline" />
          升级漏斗统计
        </h2>
        <span class="text-xs text-gray-500">
          按版本聚合客户端升级各环节转化率 · 失败告警
        </span>
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto flex-wrap">
        <NSelect
          :value="selectedApp"
          :options="appOptions"
          :loading="appsLoading"
          size="small"
          class="w-40"
          placeholder="选择应用"
          @update:value="handleAppChange"
        />
        <NDatePicker
          type="datetimerange"
          size="small"
          class="w-70"
          clearable
          @update:value="handleTimeChange"
        />
        <NButton size="small" :loading="loading" @click="loadStats()">
          <template #icon>
            <NIcon :component="RefreshOutline" />
          </template>
        </NButton>
      </div>
    </div>

    <template v-if="selectedApp">
      <NGrid
        cols="2 s:3 m:4"
        responsive="screen"
        :x-gap="12"
        :y-gap="12"
        class="mb-4"
      >
        <NGridItem>
          <NCard size="small" class="rounded-xl">
            <NStatistic label="检查无更新" :value="checkNoUpdateTotal" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" class="rounded-xl">
            <NStatistic label="提示更新" :value="totalPromptShow" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" class="rounded-xl">
            <NStatistic label="安装成功" :value="totalInstallSuccess" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" class="rounded-xl">
            <NStatistic label="整体成功率" :value="overallSuccessRate" />
          </NCard>
        </NGridItem>
      </NGrid>

      <NCard size="small" class="rounded-xl">
        <template #header>
          <span class="text-sm font-medium">漏斗明细</span>
        </template>
        <NDataTable
          :columns="columns"
          :data="items"
          :loading="loading"
          :bordered="false"
          :single-line="false"
          :scroll-x="1100"
        >
          <template #empty>
            <NEmpty description="暂无升级事件数据" />
          </template>
        </NDataTable>
      </NCard>
    </template>

    <div v-else class="py-20">
      <NEmpty description="暂无应用，请先前往 APP 版本管理创建应用">
        <template #extra>
          <NButton
            size="small"
            type="primary"
            @click="$router.push({ name: 'app-update' })"
          >
            <template #icon>
              <NIcon :component="CloudDownloadOutline" />
            </template>
            去创建
          </NButton>
        </template>
      </NEmpty>
    </div>
  </main>
</template>
