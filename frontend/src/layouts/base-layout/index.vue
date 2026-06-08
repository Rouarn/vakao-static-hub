<script setup lang="ts">
/**
 * 基础布局组件
 * 应用的主布局容器，整合了所有核心功能模块
 */
import { ref, provide, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  useMessage,
  NModal,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
} from 'naive-ui';
import { http } from '@/service/request/http';
import {
  getCategories,
  getFiles,
  deleteFile,
  refreshPhotoCache,
  getRoots,
  type ResourceRoot,
  type FileItem,
} from '@/service/api/files';
import { useAuthStore } from '@/stores/modules/auth';
import UploadModal from '@/components/upload-modal.vue';
import Header from '@/layouts/modules/global-header/index.vue';
import Sidebar from '@/layouts/modules/global-menu/index.vue';
import Footer from '@/layouts/modules/global-footer/index.vue';
import GlobalContent from '@/layouts/modules/global-content/index.vue';
import RootManagementModal from '@/components/root-management.vue';
import {
  appContextKey,
  type ViewMode,
  type SortField,
  type SortOrder,
} from '@/contexts/app';

// --- 类型与常量 ---
type ToastType = 'info' | 'success' | 'error';

// --- Store & Router ---
const authStore = useAuthStore();
const router = useRouter();
const message = useMessage();

// --- 状态定义 ---
// 根目录与分类
const roots = ref<ResourceRoot[]>([]);
const currentRootId = ref('');
const categories = ref<string[]>([]);
const currentCategory = ref('TemporaryFile');

// 文件列表与分页
const files = ref<FileItem[]>([]);
const totalFiles = ref(0);
const page = ref(1);
const pageSize = ref(100);

// 视图与搜索
const viewMode = ref<ViewMode>('grid');
const searchQuery = ref('');
const sortBy = ref<SortField>('mtime');
const sortOrder = ref<SortOrder>('desc');

// UI 交互状态
const showRootSettings = ref(false);
const showUploadModal = ref(false);
const showDeleteModal = ref(false);
const deleteTargetPath = ref('');
const isSidebarOpen = ref(false);

// --- 辅助工具函数 ---
const showToast = (text: string, type: ToastType = 'info') =>
  message[type](text);

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (dateStr: string | number) =>
  new Date(dateStr).toLocaleString();

const fileUrl = (path: string) => {
  const base = (http.defaults.baseURL || window.location.origin).replace(
    /\/$/,
    '',
  );
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/files/${currentRootId.value}/${encodeURIComponent(currentCategory.value)}/${encodedPath}`;
};

// --- 数据加载逻辑 ---
/** 加载根目录 */
async function loadRoots() {
  try {
    const { data } = await getRoots();
    roots.value = data.data || [];

    if (roots.value.length > 0) {
      const exists = roots.value.find((r) => r.id === currentRootId.value);
      if (!currentRootId.value || !exists) {
        currentRootId.value = roots.value[0].id;
      }
    } else {
      currentRootId.value = '';
    }
  } catch {
    showToast('加载资源目录失败', 'error');
  }
}

/** 加载分类 */
async function loadCategories() {
  if (!currentRootId.value) return;
  try {
    const { data } = await getCategories(currentRootId.value);
    categories.value = data.data?.length ? data.data : ['TemporaryFile'];
  } catch {
    categories.value = ['TemporaryFile'];
    showToast('加载分类失败', 'error');
  }
}

/** 加载文件列表 */
async function loadFiles() {
  if (!currentRootId.value) return;
  try {
    const { data } = await getFiles(
      currentRootId.value,
      currentCategory.value,
      {
        page: page.value,
        pageSize: pageSize.value,
        q: searchQuery.value,
        sort: sortBy.value,
        order: sortOrder.value,
      },
    );
    files.value = data.data.items || [];
    totalFiles.value = data.data.total || 0;
  } catch {
    files.value = [];
    totalFiles.value = 0;
    showToast('加载文件失败', 'error');
  }
}

// --- 事件处理 ---
async function handleRootChange(id: string) {
  currentRootId.value = id;
  await loadCategories();
  if (!categories.value.includes(currentCategory.value)) {
    currentCategory.value = categories.value[0] || 'TemporaryFile';
  }
  page.value = 1;
  await loadFiles();
}

async function handleRootsUpdated() {
  await loadRoots();
  await loadCategories();
  if (!categories.value.includes(currentCategory.value)) {
    currentCategory.value = categories.value[0] || 'TemporaryFile';
  }
  page.value = 1;
  await loadFiles();
}

async function confirmDelete() {
  if (!deleteTargetPath.value) return;
  try {
    await deleteFile(
      currentRootId.value,
      currentCategory.value,
      deleteTargetPath.value,
    );
    showToast('删除成功', 'success');
    showDeleteModal.value = false;
    await loadFiles();
  } catch {
    showToast('删除失败', 'error');
  }
}

async function refreshCache() {
  try {
    await refreshPhotoCache();
    showToast('图片缓存已刷新', 'success');
    await loadFiles();
  } catch (error: any) {
    showToast(
      error.response?.data?.message || error.message || '刷新缓存失败',
      'error',
    );
  }
}

function handleCategoryClick(cat: string) {
  currentCategory.value = cat;
  page.value = 1;
  router.push({ name: 'file-list' });
  loadFiles();
}

async function handleUploadSuccess(category: string) {
  showToast('上传成功', 'success');
  showUploadModal.value = false;
  if (!categories.value.includes(category)) {
    await loadCategories();
  }
  currentCategory.value = category;
  await loadFiles();
}

// --- 生命周期 ---
onMounted(() => {
  if (authStore.isLoggedIn) {
    loadRoots().then(() => {
      loadCategories().then(() => {
        if (
          categories.value.length &&
          !categories.value.includes(currentCategory.value)
        ) {
          currentCategory.value = categories.value[0];
        }
        loadFiles();
      });
    });
  }
});

// --- Provide 全局上下文 ---
provide(appContextKey, {
  roots,
  currentRootId,
  categories,
  currentCategory,
  files,
  totalFiles,
  page,
  pageSize,
  viewMode,
  searchQuery,
  sortBy,
  sortOrder,
  formatSize,
  formatDate,
  fileUrl,
  loadFiles,
  switchView: (mode) => (viewMode.value = mode),
  openDeleteModal: (path) => {
    deleteTargetPath.value = path;
    showDeleteModal.value = true;
  },
  handlePageChange: (p) => {
    page.value = p;
    loadFiles();
  },
  handleSearch: () => {
    page.value = 1;
    loadFiles();
  },
});
</script>

<template>
  <NLayout
    id="app-screen"
    class="h-screen overflow-hidden bg-container text-base"
  >
    <!-- Header -->
    <NLayoutHeader bordered class="h-15 flex items-center bg-base">
      <Header
        username="Admin"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
        @refresh-cache="refreshCache"
        @open-upload-modal="showUploadModal = true"
        @logout="
          () => {
            authStore.clearAuth();
            router.replace({ name: 'login' });
          }
        "
      />
    </NLayoutHeader>

    <NLayout has-sider class="bg-container">
      <!-- Sidebar -->
      <NLayoutSider
        :native-scrollbar="false"
        content-style="display: flex; flex-direction: column; height: 100%;"
        collapse-mode="transform"
        :collapsed-width="0"
        :width="240"
        class="fixed inset-y-0 left-0 z-20 transition-transform duration-300 md:static md:h-[calc(100vh-60px)] bg-base"
        :class="
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        "
      >
        <Sidebar
          :categories="categories"
          :current-category="currentCategory"
          :roots="roots"
          :current-root-id="currentRootId"
          @select-category="handleCategoryClick"
          @update:current-root-id="handleRootChange"
          @open-settings="showRootSettings = true"
        />
      </NLayoutSider>

      <!-- Main Content -->
      <NLayoutContent class="relative h-[calc(100vh-60px)] bg-container">
        <div class="flex flex-col h-full">
          <div class="flex-1 overflow-y-auto">
            <!-- Mobile Overlay -->
            <div
              v-show="isSidebarOpen"
              class="fixed inset-0 z-10 bg-black/50 transition-opacity md:hidden"
              @click="isSidebarOpen = false"
            />

            <GlobalContent />

            <!-- Modals -->
            <UploadModal
              v-if="showUploadModal"
              :visible="showUploadModal"
              :categories="categories"
              :default-category="currentCategory"
              :root-id="currentRootId"
              @close="showUploadModal = false"
              @uploaded="handleUploadSuccess"
              @error="(msg: string) => showToast(msg, 'error')"
            />

            <RootManagementModal
              v-model:visible="showRootSettings"
              :all-roots="roots"
              @refresh="handleRootsUpdated"
            />

            <NModal
              v-model:show="showDeleteModal"
              preset="dialog"
              title="确认删除"
              content="此操作不可恢复，确定要删除吗？"
              positive-text="删除"
              negative-text="取消"
              @positive-click="confirmDelete"
            />
          </div>

          <Footer
            :year="new Date().getFullYear()"
            :root-id="currentRootId"
            :category="currentCategory"
          />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
