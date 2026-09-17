import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/modules/auth';
import router from '@/router';
import {
  getRoots,
  getCategories,
  getFiles,
  deleteFile as apiDeleteFile,
  syncFileIndex,
} from '@/api/files';
import type {
  ResourceRoot,
  FileItem,
  ViewMode,
  SortField,
  SortOrder,
} from '@vakao/shared';

export const useFileListStore = defineStore('file-list', () => {
  const authStore = useAuthStore();

  const roots = ref<ResourceRoot[]>([]);
  const currentRootId = ref('');
  const categories = ref<string[]>([]);
  const currentCategory = ref('TemporaryFile');
  const files = ref<FileItem[]>([]);
  const totalFiles = ref(0);
  const page = ref(1);
  const pageSize = ref(100);
  const viewMode = ref<ViewMode>('grid');
  const searchQuery = ref('');
  const sortBy = ref<SortField>('mtime');
  const sortOrder = ref<SortOrder>('desc');
  const loading = ref(false);

  const fileUrl = computed(() => (path: string) => {
    const base = window.location.origin;
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${base}/files/${currentRootId.value}/${encodeURIComponent(currentCategory.value)}/${encodedPath}`;
  });

  async function loadRoots() {
    try {
      const data = await getRoots();
      roots.value = data || [];
      if (roots.value.length > 0) {
        const exists = roots.value.find((r) => r.id === currentRootId.value);
        if (!currentRootId.value || !exists) {
          currentRootId.value = roots.value[0].id;
        }
      } else {
        currentRootId.value = '';
      }
    } catch {
      console.error('加载资源目录失败');
    }
  }

  async function loadCategories() {
    if (!currentRootId.value) return;
    try {
      const data = await getCategories(currentRootId.value);
      categories.value = data?.length ? data : ['TemporaryFile'];
    } catch {
      categories.value = ['TemporaryFile'];
    }
  }

  async function loadFiles() {
    if (!currentRootId.value) return;
    loading.value = true;
    try {
      const data = await getFiles(currentRootId.value, currentCategory.value, {
        page: page.value,
        pageSize: pageSize.value,
        q: searchQuery.value,
        sort: sortBy.value,
        order: sortOrder.value,
      });
      files.value = data.items || [];
      totalFiles.value = data.total || 0;
    } catch {
      files.value = [];
      totalFiles.value = 0;
    } finally {
      loading.value = false;
    }
  }

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

  async function handleCategoryClick(cat: string) {
    currentCategory.value = cat;
    page.value = 1;
    await router.push({ name: 'file-list' });
    await loadFiles();
  }

  async function handleDeleteFile(path: string) {
    try {
      await apiDeleteFile(currentRootId.value, currentCategory.value, path);
      await loadFiles();
      return true;
    } catch {
      return false;
    }
  }

  async function handleRefreshCache() {
    try {
      await syncFileIndex();
      await loadFiles();
      return true;
    } catch {
      return false;
    }
  }

  async function handlePageChange(p: number) {
    page.value = p;
    await loadFiles();
  }

  async function handleSearch() {
    page.value = 1;
    await loadFiles();
  }

  function switchView(mode: ViewMode) {
    viewMode.value = mode;
  }

  async function init() {
    if (authStore.isLoggedIn) {
      await loadRoots();
      await loadCategories();
      if (
        categories.value.length &&
        !categories.value.includes(currentCategory.value)
      ) {
        currentCategory.value = categories.value[0];
      }
      await loadFiles();
    }
  }

  return {
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
    loading,
    fileUrl,
    loadRoots,
    loadCategories,
    loadFiles,
    handleRootChange,
    handleRootsUpdated,
    handleCategoryClick,
    handleDeleteFile,
    handleRefreshCache,
    handlePageChange,
    handleSearch,
    switchView,
    init,
  };
});
