<script setup lang="ts">
import { ref, onMounted, computed, h, watch, type VNode } from 'vue';
import {
  useMessage,
  NDataTable,
  NButton,
  NIcon,
  NPopconfirm,
  NSpace,
  NTag,
  NSelect,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  NTooltip,
  NEmpty,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui';
import {
  CloudDownloadOutline,
  RefreshOutline,
  RocketOutline,
  CloudOfflineOutline,
  TrashOutline,
  CreateOutline,
  AddCircleOutline,
  PhonePortraitOutline,
} from '@vicons/ionicons5';
import {
  getApps,
  createApp,
  getVersions,
  updateVersion,
  setForceUpdate,
  offlineVersion,
  removeVersion,
} from '@/api/app-update';
import type { AppVersion } from '@/types/models';
import { formatSize, formatDate } from '@/utils/format';
import VersionFormModal from './version-form-modal.vue';
import PublishModal from './publish-modal.vue';
import type { AxiosError } from 'axios';

defineOptions({
  name: 'app-update',
});

const message = useMessage();

const apps = ref<string[]>([]);
const selectedApp = ref<string | null>(null);
const appsLoading = ref(false);

const loading = ref(false);
const rows = ref<AppVersion[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const statusFilter = ref<number | null>(null);

const showUpload = ref(false);
const showPublish = ref(false);
const publishTarget = ref<AppVersion | null>(null);
const showCreateApp = ref(false);
const newAppKey = ref('');
const createAppLoading = ref(false);

const showEdit = ref(false);
const editTarget = ref<AppVersion | null>(null);
const editForm = ref({ versionName: '', updateLog: '', remark: '' });
const editSaving = ref(false);
const editFormRef = ref();

const STATUS_MAP: Record<
  number,
  { label: string; type: 'default' | 'info' | 'success' | 'warning' }
> = {
  0: { label: '草稿', type: 'default' },
  1: { label: '灰度', type: 'info' },
  2: { label: '全量', type: 'success' },
  3: { label: '已下架', type: 'warning' },
};

const statusOptions = [
  { label: '全部状态', value: -1 },
  { label: '草稿', value: 0 },
  { label: '灰度', value: 1 },
  { label: '全量', value: 2 },
  { label: '已下架', value: 3 },
];

const appOptions = computed(() =>
  apps.value.map((appKey) => ({ label: appKey, value: appKey })),
);

async function loadApps(selectFirst = false) {
  appsLoading.value = true;
  try {
    apps.value = await getApps();
    if (selectFirst && apps.value.length > 0 && !selectedApp.value) {
      selectedApp.value = apps.value[0];
      void loadList();
    }
    if (selectedApp.value && !apps.value.includes(selectedApp.value)) {
      selectedApp.value = null;
    }
  } catch {
    message.error('加载应用列表失败');
  } finally {
    appsLoading.value = false;
  }
}

function handleAppChange(value: string | null) {
  selectedApp.value = value;
  page.value = 1;
  if (value) void loadList();
  else rows.value = [];
}

async function loadList() {
  if (!selectedApp.value) {
    rows.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const data = await getVersions({
      page: page.value,
      pageSize: pageSize.value,
      appKey: selectedApp.value,
      status:
        statusFilter.value === null || statusFilter.value === -1
          ? undefined
          : statusFilter.value,
    });
    rows.value = data.items;
    total.value = data.total;
  } catch {
    message.error('加载版本列表失败');
  } finally {
    loading.value = false;
  }
}

function handleStatusFilter(value: number | null) {
  statusFilter.value = value;
  page.value = 1;
  void loadList();
}

function handlePageChange(p: number) {
  page.value = p;
  void loadList();
}

function handlePageSizeChange(ps: number) {
  pageSize.value = ps;
  page.value = 1;
  void loadList();
}

const pagination = computed<PaginationProps>(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: handlePageChange,
  onUpdatePageSize: handlePageSizeChange,
  prefix: (info: { itemCount?: number }) => `共 ${info.itemCount ?? 0} 个版本`,
}));

// 新建应用
watch(showCreateApp, (show) => {
  if (show) newAppKey.value = '';
});

async function submitCreateApp() {
  const appKey = newAppKey.value.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(appKey)) {
    message.error('应用标识仅允许字母数字与 _ -');
    return;
  }
  createAppLoading.value = true;
  try {
    await createApp(appKey);
    message.success(`应用 ${appKey} 已创建`);
    showCreateApp.value = false;
    await loadApps();
    selectedApp.value = appKey;
    await loadList();
  } catch (err) {
    message.error(extractErrMsg(err, '创建应用失败'));
  } finally {
    createAppLoading.value = false;
  }
}

function openUpload() {
  if (!selectedApp.value) {
    message.warning('请先选择或创建一个应用');
    return;
  }
  showUpload.value = true;
}

function openPublish(row: AppVersion) {
  publishTarget.value = row;
  showPublish.value = true;
}

function openEdit(row: AppVersion) {
  editTarget.value = row;
  editForm.value = {
    versionName: row.versionName,
    updateLog: row.updateLog ?? '',
    remark: row.remark ?? '',
  };
  showEdit.value = true;
}

async function saveEdit() {
  try {
    await editFormRef.value?.validate();
  } catch {
    return;
  }
  if (!editTarget.value) return;
  editSaving.value = true;
  try {
    await updateVersion(editTarget.value.id, {
      versionName: editForm.value.versionName.trim(),
      updateLog: editForm.value.updateLog.trim() || undefined,
      remark: editForm.value.remark.trim() || undefined,
    });
    message.success('已保存');
    showEdit.value = false;
    await loadList();
  } catch (err) {
    message.error(extractErrMsg(err, '保存失败'));
  } finally {
    editSaving.value = false;
  }
}

function extractErrMsg(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>;
  return axiosErr.response?.data?.message || fallback;
}

async function handleForceToggle(row: AppVersion, enabled: boolean) {
  try {
    await setForceUpdate(row.id, { forceUpdate: enabled });
    message.success(enabled ? '已开启强更（立即生效）' : '已解除强更');
    await loadList();
  } catch (err) {
    message.error(extractErrMsg(err, '操作失败'));
    await loadList();
  }
}

async function handleOffline(row: AppVersion) {
  try {
    await offlineVersion(row.id);
    message.success('已下架，客户端立即不可见');
    await loadList();
  } catch (err) {
    message.error(extractErrMsg(err, '下架失败'));
  }
}

async function handleRemove(row: AppVersion) {
  try {
    await removeVersion(row.id);
    message.success('已删除记录（物理文件保留）');
    await loadList();
  } catch (err) {
    message.error(extractErrMsg(err, '删除失败'));
  }
}

const editable = (row: AppVersion) => row.status === 0 || row.status === 3;
const publishable = (row: AppVersion) => row.status !== 2;

const columns = computed<DataTableColumns<AppVersion>>(() => [
  {
    title: '版本',
    key: 'versionName',
    width: 150,
    render(row) {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-medium' }, `v${row.versionName}`),
        h(
          'span',
          { class: 'text-xs text-gray-400' },
          `code: ${row.versionCode}`,
        ),
      ]);
    },
  },
  {
    title: '安装包',
    key: 'relPath',
    ellipsis: { tooltip: true },
    render(row) {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm' }, row.relPath),
        h(
          'span',
          { class: 'text-xs text-gray-400 font-mono' },
          `${formatSize(row.packageSize)} · ${row.checksum.slice(0, 12)}…`,
        ),
      ]);
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render(row) {
      const s = STATUS_MAP[row.status];
      const label =
        row.status === 1 ? `${s.label} ${row.grayPercent}%` : s.label;
      return h(
        NTag,
        { type: s.type, size: 'small', round: true, bordered: false },
        () => label,
      );
    },
  },
  {
    title: '强更',
    key: 'forceUpdate',
    width: 90,
    render(row) {
      if (row.status === 0) {
        return h('span', { class: 'text-xs text-gray-300' }, '—');
      }
      return h(NTooltip, null, {
        trigger: () =>
          h(NSwitch, {
            size: 'small',
            value: row.forceUpdate === 1,
            'onUpdate:value': (v: boolean) => handleForceToggle(row, v),
          }),
        default: () =>
          row.minVersionCode > 0
            ? `低于 code ${row.minVersionCode} 的客户端一律按强更处理`
            : '强更弹窗不可关闭，远程开关立即生效',
      });
    },
  },
  {
    title: '发布时间',
    key: 'publishTime',
    width: 170,
    render(row) {
      return h(
        'span',
        { class: 'text-sm text-gray-500' },
        row.publishTime ? formatDate(row.publishTime) : '未发布',
      );
    },
  },
  {
    title: '备注',
    key: 'remark',
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { class: 'text-xs text-gray-400' }, row.remark ?? '—');
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 270,
    fixed: 'right',
    render(row) {
      const actions: VNode[] = [];
      if (publishable(row)) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              type: 'primary',
              onClick: () => openPublish(row),
            },
            {
              icon: () => h(NIcon, null, () => h(RocketOutline)),
              default: () => '发布',
            },
          ),
        );
      }
      if (editable(row)) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              onClick: () => openEdit(row),
            },
            {
              icon: () => h(NIcon, null, () => h(CreateOutline)),
              default: () => '编辑',
            },
          ),
        );
      }
      if (row.status === 1 || row.status === 2) {
        actions.push(
          h(
            NPopconfirm,
            {
              'positive-text': '下架',
              'negative-text': '取消',
              onPositiveClick: () => handleOffline(row),
            },
            {
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'warning' },
                  {
                    icon: () => h(NIcon, null, () => h(CloudOfflineOutline)),
                    default: () => '下架',
                  },
                ),
              default: () =>
                '下架后客户端立即检测不到此版本（止血开关），确定？',
            },
          ),
        );
      }
      if (editable(row)) {
        actions.push(
          h(
            NPopconfirm,
            {
              'positive-text': '删除',
              'negative-text': '取消',
              onPositiveClick: () => handleRemove(row),
            },
            {
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'error' },
                  {
                    icon: () => h(NIcon, null, () => h(TrashOutline)),
                    default: () => '删除',
                  },
                ),
              default: () => '仅删除记录，安装包文件永久保留。确定删除？',
            },
          ),
        );
      }
      return h(NSpace, { size: 'small' }, () => actions);
    },
  },
]);

const editRules = {
  versionName: {
    required: true,
    message: '请输入版本名',
    trigger: 'blur',
  },
};

onMounted(() => {
  void loadApps(true);
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
          <NIcon :component="CloudDownloadOutline" />
          APP 版本管理
        </h2>
        <span class="text-xs text-gray-500">
          software-update 根目录下每个应用独立维护版本 · 灰度 · 强更 · 下架止血
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
        <NButton size="small" @click="showCreateApp = true">
          <template #icon>
            <NIcon :component="AddCircleOutline" />
          </template>
          新建应用
        </NButton>
        <NSelect
          :value="statusFilter"
          :options="statusOptions"
          size="small"
          class="w-32"
          placeholder="选择状态"
          @update:value="handleStatusFilter"
        />
        <NButton size="small" @click="loadList()" :loading="loading">
          <template #icon>
            <NIcon :component="RefreshOutline" />
          </template>
        </NButton>
        <NButton
          size="small"
          type="primary"
          :disabled="!selectedApp"
          @click="openUpload"
        >
          上传新版本
        </NButton>
      </div>
    </div>

    <template v-if="selectedApp">
      <div class="mb-3 flex items-center gap-2">
        <NTag round :bordered="false" type="info" size="small">
          <template #icon>
            <NIcon :component="PhonePortraitOutline" />
          </template>
          {{ selectedApp }}
        </NTag>
        <span class="text-xs text-gray-400">
          检查接口：/static/app-updates/check?appKey={{
            selectedApp
          }}&amp;platform=android&amp;versionCode=N
        </span>
      </div>

      <NDataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        :bordered="false"
        :single-line="false"
        :scroll-x="1100"
        :pagination="pagination"
        remote
        class="rounded-xl shadow-sm"
      />
    </template>

    <div v-else class="py-20">
      <NEmpty description="暂无应用，请先新建应用（如 xiaolv、xiaolan）">
        <template #extra>
          <NButton size="small" type="primary" @click="showCreateApp = true">
            新建应用
          </NButton>
        </template>
      </NEmpty>
    </div>

    <!-- 新建应用 -->
    <NModal
      :show="showCreateApp"
      preset="card"
      title="新建应用"
      class="w-[420px]"
      :mask-closable="!createAppLoading"
      @update:show="(v: boolean) => (showCreateApp = v)"
    >
      <NForm label-placement="left" label-width="90">
        <NFormItem label="应用标识">
          <NInput
            v-model:value="newAppKey"
            placeholder="字母数字与 _ -，如 xiaolv"
            :disabled="createAppLoading"
            @keyup.enter="submitCreateApp"
          />
        </NFormItem>
      </NForm>
      <p class="text-xs text-gray-400 -mt-2">
        将在 software-update 资源根下创建同名目录，该应用的安装包全部归档于此
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton :disabled="createAppLoading" @click="showCreateApp = false">
            取消
          </NButton>
          <NButton
            type="primary"
            :loading="createAppLoading"
            @click="submitCreateApp"
          >
            创建
          </NButton>
        </div>
      </template>
    </NModal>

    <VersionFormModal
      v-model:show="showUpload"
      :app-key="selectedApp ?? ''"
      @saved="loadList()"
    />
    <PublishModal
      v-model:show="showPublish"
      :version="publishTarget"
      @saved="loadList()"
    />

    <NModal
      :show="showEdit"
      preset="card"
      :title="`编辑版本 v${editTarget?.versionName ?? ''}`"
      class="w-[480px]"
      @update:show="(v: boolean) => (showEdit = v)"
    >
      <NForm
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-placement="left"
        label-width="90"
      >
        <NFormItem label="版本名" path="versionName">
          <NInput v-model:value="editForm.versionName" placeholder="如 1.0.1" />
        </NFormItem>
        <NFormItem label="更新说明">
          <NInput
            v-model:value="editForm.updateLog"
            type="textarea"
            :rows="4"
            placeholder="每行一条更新内容"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="editForm.remark" placeholder="内部备注" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showEdit = false">取消</NButton>
          <NButton type="primary" :loading="editSaving" @click="saveEdit">
            保存
          </NButton>
        </div>
      </template>
    </NModal>
  </main>
</template>
