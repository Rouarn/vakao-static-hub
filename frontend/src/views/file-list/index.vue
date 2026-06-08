<script setup lang="ts">
/**
 * 文件列表组件
 * 展示文件数据，支持网格/列表视图切换，分页，删除和下载
 */
import { computed, h, ref, inject } from 'vue';
import {
  useBreakpoints,
  breakpointsTailwind,
  useElementSize,
  useVirtualList,
  useWindowSize,
} from '@vueuse/core';
import { NIcon, NDataTable, NPagination, NImageGroup } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import FileCard from './file-card.vue';
import {
  AppsOutline,
  ReorderThreeOutline,
  RefreshOutline,
  FolderOpenOutline,
  DocumentOutline,
  DownloadOutline,
  TrashOutline,
  SearchOutline,
  ArrowUpOutline,
  ArrowDownOutline,
} from '@vicons/ionicons5';
import { appContextKey, type SortField } from '@/contexts/app';

defineOptions({
  name: 'file-list',
});

interface FileItem {
  path: string;
  size: number;
  mtime: string | number;
}

const appContext = inject(appContextKey)!;

const {
  files,
  totalFiles,
  page,
  pageSize,
  viewMode,
  currentCategory,
  searchQuery,
  sortBy,
  sortOrder,
  formatSize,
  formatDate,
  fileUrl,
  loadFiles,
  switchView,
  openDeleteModal,
  handlePageChange,
  handleSearch,
} = appContext;

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('md');

// 虚拟列表配置
const mainContainer = ref<HTMLElement | null>(null);
const { width: containerWidth } = useElementSize(mainContainer);
const { width: windowWidth } = useWindowSize();

const gridCols = computed(() => {
  let width = containerWidth.value;
  const winWidth = windowWidth.value;

  // 如果获取不到容器宽度（例如初始化时），使用窗口宽度进行估算
  if (width <= 0) {
    if (winWidth > 0) {
      // 估算：窗口宽度 - 侧边栏(约260px) - Padding
      // 注意：这只是一个临时兜底，useElementSize 更新后会自动修正
      width = winWidth - (isMobile.value ? 32 : 280);
    } else {
      return 2;
    }
  }

  // 减去左右 padding (md:px-6 = 48px, px-4 = 32px)
  // 还要减去滚动条宽度（约 10-15px），为了安全起见多减一点
  const padding = isMobile.value ? 32 : 64;
  const contentWidth = width - padding;

  if (contentWidth <= 0) return 2;

  const gap = 20; // gap-5 (1.25rem = 20px)
  const minWidth = 160;

  // 计算逻辑：(minWidth + gap) * cols - gap <= contentWidth
  // 即：cols * (minWidth + gap) <= contentWidth + gap
  const cols = Math.floor((contentWidth + gap) / (minWidth + gap));

  return Math.max(2, cols); // 最少2列
});

const chunkedFiles = computed(() => {
  const cols = gridCols.value;
  const result = [];
  for (let i = 0; i < files.value.length; i += cols) {
    result.push({
      id: i,
      items: files.value.slice(i, i + cols),
    });
  }
  return result;
});

const {
  list: virtualRows,
  containerProps,
  wrapperProps,
} = useVirtualList(chunkedFiles, {
  itemHeight: 200, // 估算高度，卡片高度 + 间距
  overscan: 2,
});

const sortOptions = [
  { label: '时间', value: 'mtime' },
  { label: '名称', value: 'name' },
  { label: '大小', value: 'size' },
];

function handleSortOrderToggle() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  handleSearch();
}

function handleSortByChange(value: SortField) {
  sortBy.value = value;
  handleSearch();
}

function handleSearchInput(value: string) {
  searchQuery.value = value;
  if (!value) {
    handleSearch();
  }
}

/**
 * 处理文件下载
 * 创建临时链接触发下载，支持添加 token
 */
function handleDownload(path: string) {
  let url = fileUrl(path);
  // 如果已登录，fileUrl 已包含认证令牌
  if (url.includes('?')) {
    url += '&download=1';
  } else {
    url += '?download=1';
  }

  // 创建临时链接以触发下载
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', ''); // 此属性有帮助，但服务器的 Content-Disposition 是关键
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type FileRow = FileItem;

/**
 * 定义列表视图的列配置
 * 使用 Naive UI 的 render 函数自定义渲染内容
 */
const columns = computed<DataTableColumns<FileRow>>(() => [
  {
    title: '文件名',
    key: 'path',
    width: 300,
    render(row) {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(
          NIcon,
          { class: 'text-xl text-[#6c757d]' },
          {
            default: () => h(DocumentOutline),
          },
        ),
        h(
          'a',
          {
            href: fileUrl(row.path),
            target: '_blank',
            title: row.path,
            class: 'text-sm font-medium text-base hover:text-primary truncate',
          },
          row.path,
        ),
      ]);
    },
  },
  {
    title: '大小',
    key: 'size',
    width: 120,
    render(row) {
      return formatSize(row.size);
    },
  },
  {
    title: '修改时间',
    key: 'mtime',
    width: 200,
    render(row) {
      return formatDate(row.mtime);
    },
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 160,
    render(row) {
      return h('div', { class: 'flex items-center justify-center gap-2' }, [
        h(
          'button',
          {
            type: 'button',
            class:
              'w-8 h-8 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] hover:bg-container hover:text-primary',
            title: '下载',
            onClick: () => handleDownload(row.path),
          },
          [
            h(NIcon, null, {
              default: () => h(DownloadOutline),
            }),
          ],
        ),
        h(
          'button',
          {
            class:
              'w-8 h-8 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] hover:bg-container hover:text-red-500',
            type: 'button',
            title: '删除',
            onClick: () => openDeleteModal(row.path),
          },
          [
            h(NIcon, null, {
              default: () => h(TrashOutline),
            }),
          ],
        ),
      ]);
    },
  },
]);
</script>

<template>
  <main
    id="fileManagerMain"
    ref="mainContainer"
    class="px-4 md:px-6 pb-4 relative"
  >
    <div
      class="flex flex-col md:flex-row items-start md:items-center justify-between py-4 mb-4 sticky top-0 z-2 bg-container/95 backdrop-blur supports-[backdrop-filter]:bg-container/80 border-b border-base shadow-sm -mx-4 md:-mx-6 px-4 md:px-6 gap-4 md:gap-0"
    >
      <div>
        <h2
          id="currentCategoryTitle"
          class="text-xl font-semibold mb-1 text-base"
        >
          {{ currentCategory }}
        </h2>
        <span id="fileCount" class="text-xs text-gray-500">
          {{ totalFiles }} 个文件
        </span>
      </div>

      <div
        class="flex flex-wrap items-center justify-between md:justify-start gap-2 md:gap-3 w-full md:w-auto"
      >
        <!-- Search Input -->
        <div
          class="flex items-center gap-1 bg-base px-1 py-1 rounded-md border border-base shadow-sm w-full md:w-auto"
        >
          <NInput
            :value="searchQuery"
            @update:value="handleSearchInput"
            @keydown.enter="handleSearch"
            placeholder="搜索文件..."
            size="tiny"
            class="w-full! md:w-40! text-xs!"
            :bordered="false"
            clearable
          >
            <template #prefix>
              <NIcon :component="SearchOutline" />
            </template>
          </NInput>
        </div>

        <!-- Sort Controls -->
        <div
          class="flex items-center gap-1 bg-base px-1 py-1 rounded-md border border-base shadow-sm"
        >
          <NSelect
            :value="sortBy"
            :options="sortOptions"
            @update:value="handleSortByChange"
            size="tiny"
            :show-arrow="false"
            class="w-20 !text-xs"
            :bordered="false"
          />
          <button
            class="w-6 h-6 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-[#6c757d] hover:bg-container hover:text-primary transition-all"
            title="切换排序顺序"
            @click="handleSortOrderToggle"
          >
            <NIcon size="14">
              <ArrowUpOutline v-if="sortOrder === 'asc'" />
              <ArrowDownOutline v-else />
            </NIcon>
          </button>
        </div>

        <div
          class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"
        ></div>

        <div
          class="flex items-center gap-1 bg-base px-1 py-1 rounded-md border border-base shadow-sm"
        >
          <button
            class="w-9 h-9 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] text-lg hover:bg-container hover:text-primary transition-all"
            :class="
              viewMode === 'grid'
                ? 'bg-primary/10! text-primary! border-primary'
                : 'border-transparent'
            "
            id="viewGrid"
            title="网格视图"
            @click="switchView('grid')"
          >
            <NIcon>
              <AppsOutline />
            </NIcon>
          </button>
          <button
            class="w-9 h-9 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] text-lg hover:bg-container hover:text-primary transition-all"
            :class="
              viewMode === 'list'
                ? 'bg-primary/10! text-primary! border-primary'
                : 'border-transparent'
            "
            id="viewList"
            title="列表视图"
            @click="switchView('list')"
          >
            <NIcon>
              <ReorderThreeOutline />
            </NIcon>
          </button>
          <button
            class="w-9 h-9 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] text-lg hover:bg-container hover:text-primary transition-all"
            id="refreshBtn"
            title="刷新"
            @click="loadFiles"
          >
            <NIcon>
              <RefreshOutline />
            </NIcon>
          </button>
        </div>
      </div>
    </div>

    <div
      id="emptyState"
      class="text-center py-16 text-[#6c757d]"
      :class="files.length > 0 ? 'hidden' : ''"
    >
      <NIcon class="text-6xl text-[#dee2e6] mb-4 block mx-auto">
        <FolderOpenOutline />
      </NIcon>
      <h3 class="text-lg text-[#212529] mb-2">此分类暂无文件</h3>
      <p class="text-sm">点击右上角“上传文件”添加资源</p>
    </div>

    <!-- Grid View with Virtual Scroll for PC -->
    <div
      v-show="files.length > 0 && viewMode === 'grid'"
      id="fileGrid"
      :class="{ 'h-[calc(100vh-300px)] overflow-y-auto': !isMobile }"
      v-bind="!isMobile ? containerProps : {}"
    >
      <div v-if="!isMobile" v-bind="wrapperProps" class="max-w-full">
        <NImageGroup>
          <div
            v-for="row in virtualRows"
            :key="row.data.id"
            class="grid gap-5 mb-5 px-1"
            :style="{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }"
          >
            <FileCard
              v-for="file in row.data.items"
              :key="file.path"
              :file="file"
              :file-url="fileUrl"
              :format-size="formatSize"
              :format-date="formatDate"
              @download="handleDownload"
              @delete="openDeleteModal"
            />
          </div>
        </NImageGroup>
      </div>

      <!-- 移动设备的普通网格视图 -->
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 md:gap-5"
      >
        <NImageGroup>
          <FileCard
            v-for="file in files"
            :key="file.path"
            :file="file"
            :file-url="fileUrl"
            :format-size="formatSize"
            :format-date="formatDate"
            @download="handleDownload"
            @delete="openDeleteModal"
          />
        </NImageGroup>
      </div>
    </div>

    <NDataTable
      v-show="files.length > 0 && viewMode === 'list'"
      id="fileList"
      class="mt-4 rounded-xl shadow-sm"
      :columns="columns"
      :data="files"
      :bordered="false"
      :single-line="false"
      :flex-height="!isMobile"
      :style="!isMobile ? { height: 'calc(100vh - 300px)' } : {}"
      :virtual-scroll="!isMobile"
    />

    <div
      v-if="totalFiles > pageSize"
      class="flex justify-center py-4 sticky bottom-0 z-2 backdrop-blur supports-[backdro8f9fa]/80 border-t border-[#e9ecef] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
    >
      <NPagination
        :page="page"
        :page-size="pageSize"
        :item-count="totalFiles"
        :page-slot="7"
        @update:page="handlePageChange"
      />
    </div>
  </main>
</template>

<style scoped>
#fileGrid {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

#fileGrid::-webkit-scrollbar {
  display: none;
}

/* 同时也隐藏列表视图的滚动条 */
:deep(.n-data-table-base-table-body) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:deep(.n-data-table-base-table-body)::-webkit-scrollbar {
  display: none;
}
</style>
