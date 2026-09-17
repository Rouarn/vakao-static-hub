<script setup lang="ts">
import { computed, h, ref } from 'vue';
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
import { useFileListStore } from '@/stores/modules/file-list/index.ts';
import type { SortField } from '@vakao/shared';
import { formatSize, formatDate } from '@/utils/format';
import { buildFileUrl } from '@/utils/url';

defineOptions({
  name: 'file-list',
});

const store = useFileListStore();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('md');

const mainContainer = ref<HTMLElement | null>(null);
const { width: containerWidth } = useElementSize(mainContainer);
const { width: windowWidth } = useWindowSize();

const gridCols = computed(() => {
  let width = containerWidth.value;
  const winWidth = windowWidth.value;

  if (width <= 0) {
    if (winWidth > 0) {
      width = winWidth - (isMobile.value ? 32 : 280);
    } else {
      return 2;
    }
  }

  const padding = isMobile.value ? 32 : 64;
  const contentWidth = width - padding;

  if (contentWidth <= 0) return 2;

  const gap = 20;
  const minWidth = 160;
  const cols = Math.floor((contentWidth + gap) / (minWidth + gap));

  return Math.max(2, cols);
});

const chunkedFiles = computed(() => {
  const cols = gridCols.value;
  const result = [];
  for (let i = 0; i < store.files.length; i += cols) {
    result.push({
      id: i,
      items: store.files.slice(i, i + cols),
    });
  }
  return result;
});

const {
  list: virtualRows,
  containerProps,
  wrapperProps,
} = useVirtualList(chunkedFiles, {
  itemHeight: 200,
  overscan: 2,
});

const sortOptions = [
  { label: '时间', value: 'mtime' },
  { label: '名称', value: 'name' },
  { label: '大小', value: 'size' },
];

function handleSortOrderToggle() {
  store.sortOrder = store.sortOrder === 'asc' ? 'desc' : 'asc';
  store.handleSearch();
}

function handleSortByChange(value: SortField) {
  store.sortBy = value;
  store.handleSearch();
}

function handleSearchInput(value: string) {
  store.searchQuery = value;
  if (!value) {
    store.handleSearch();
  }
}

function fileUrl(path: string) {
  return buildFileUrl(store.currentRootId, store.currentCategory, path);
}

function handleDownload(path: string) {
  let url = fileUrl(path);
  if (url.includes('?')) {
    url += '&download=1';
  } else {
    url += '?download=1';
  }

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type FileRow = { path: string; size: number; mtime: string | number };

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

const showDeleteModal = ref(false);
const deleteTargetPath = ref('');

function openDeleteModal(path: string) {
  deleteTargetPath.value = path;
  showDeleteModal.value = true;
}

import { NModal, useMessage } from 'naive-ui';
const message = useMessage();

async function confirmDelete() {
  if (!deleteTargetPath.value) return;
  const ok = await store.handleDeleteFile(deleteTargetPath.value);
  if (ok) {
    message.success('删除成功');
    showDeleteModal.value = false;
  } else {
    message.error('删除失败');
  }
}
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
          {{ store.currentCategory }}
        </h2>
        <span id="fileCount" class="text-xs text-gray-500">
          {{ store.totalFiles }} 个文件
        </span>
      </div>

      <div
        class="flex flex-wrap items-center justify-between md:justify-start gap-2 md:gap-3 w-full md:w-auto"
      >
        <div
          class="flex items-center gap-1 bg-base px-1 py-1 rounded-md border border-base shadow-sm w-full md:w-auto"
        >
          <NInput
            :value="store.searchQuery"
            @update:value="handleSearchInput"
            @keydown.enter="store.handleSearch"
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

        <div
          class="flex items-center gap-1 bg-base px-1 py-1 rounded-md border border-base shadow-sm"
        >
          <NSelect
            :value="store.sortBy"
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
              <ArrowUpOutline v-if="store.sortOrder === 'asc'" />
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
              store.viewMode === 'grid'
                ? 'bg-primary/10! text-primary! border-primary'
                : 'border-transparent'
            "
            title="网格视图"
            @click="store.switchView('grid')"
          >
            <NIcon>
              <AppsOutline />
            </NIcon>
          </button>
          <button
            class="w-9 h-9 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] text-lg hover:bg-container hover:text-primary transition-all"
            :class="
              store.viewMode === 'list'
                ? 'bg-primary/10! text-primary! border-primary'
                : 'border-transparent'
            "
            title="列表视图"
            @click="store.switchView('list')"
          >
            <NIcon>
              <ReorderThreeOutline />
            </NIcon>
          </button>
          <button
            class="w-9 h-9 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent text-[#6c757d] text-lg hover:bg-container hover:text-primary transition-all"
            title="刷新"
            @click="store.loadFiles"
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
      :class="store.files.length > 0 ? 'hidden' : ''"
    >
      <NIcon class="text-6xl text-[#dee2e6] mb-4 block mx-auto">
        <FolderOpenOutline />
      </NIcon>
      <h3 class="text-lg text-[#212529] mb-2">此分类暂无文件</h3>
      <p class="text-sm">点击右上角"上传文件"添加资源</p>
    </div>

    <div
      v-show="store.files.length > 0 && store.viewMode === 'grid'"
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

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 md:gap-5"
      >
        <NImageGroup>
          <FileCard
            v-for="file in store.files"
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
      v-show="store.files.length > 0 && store.viewMode === 'list'"
      id="fileList"
      class="mt-4 rounded-xl shadow-sm"
      :columns="columns"
      :data="store.files"
      :bordered="false"
      :single-line="false"
      :flex-height="!isMobile"
      :style="!isMobile ? { height: 'calc(100vh - 300px)' } : {}"
      :virtual-scroll="!isMobile"
    />

    <div
      v-if="store.totalFiles > store.pageSize"
      class="flex justify-center py-4 sticky bottom-0 z-2 backdrop-blur supports-[backdro8f9fa]/80 border-t border-[#e9ecef] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
    >
      <NPagination
        :page="store.page"
        :page-size="store.pageSize"
        :item-count="store.totalFiles"
        :page-slot="7"
        @update:page="store.handlePageChange"
      />
    </div>

    <NModal
      v-model:show="showDeleteModal"
      preset="dialog"
      title="确认删除"
      content="此操作不可恢复，确定要删除吗？"
      positive-text="删除"
      negative-text="取消"
      @positive-click="confirmDelete"
    />
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

:deep(.n-data-table-base-table-body) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:deep(.n-data-table-base-table-body)::-webkit-scrollbar {
  display: none;
}
</style>
