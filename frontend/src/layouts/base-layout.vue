<script setup lang="ts">
import { useFileListStore } from '@/stores/modules/file-list/index.ts';
import AppHeader from './modules/app-header.vue';
import AppSidebar from './modules/app-sidebar.vue';
import AppFooter from './modules/app-footer.vue';
import AppContent from './modules/app-content.vue';
import UploadModal from '@/components/upload-modal.vue';
import RootManagementModal from '@/components/root-management.vue';
import { NModal, useMessage } from 'naive-ui';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/modules/auth';

const store = useFileListStore();
const authStore = useAuthStore();
const router = useRouter();
const message = useMessage();

const showRootSettings = ref(false);
const showUploadModal = ref(false);
const showDeleteModal = ref(false);
const deleteTargetPath = ref('');
const isSidebarOpen = ref(false);

const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') =>
  message[type](text);

async function confirmDelete() {
  if (!deleteTargetPath.value) return;
  const ok = await store.handleDeleteFile(deleteTargetPath.value);
  if (ok) {
    showToast('删除成功', 'success');
    showDeleteModal.value = false;
  } else {
    showToast('删除失败', 'error');
  }
}

async function refreshCache() {
  const ok = await store.handleRefreshCache();
  if (ok) {
    showToast('图片缓存已刷新', 'success');
  } else {
    showToast('刷新缓存失败', 'error');
  }
}

async function handleUploadSuccess(category: string) {
  showToast('上传成功', 'success');
  showUploadModal.value = false;
  if (!store.categories.includes(category)) {
    await store.loadCategories();
  }
  store.currentCategory = category;
  await store.loadFiles();
}

onMounted(() => {
  store.init();
});
</script>

<template>
  <div class="h-screen overflow-hidden bg-container text-base flex flex-col">
    <AppHeader
      class="h-15 flex-shrink-0"
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

    <div class="flex flex-1 overflow-hidden">
      <AppSidebar
        :is-open="isSidebarOpen"
        @close-sidebar="isSidebarOpen = false"
        @open-settings="showRootSettings = true"
      />

      <div class="flex-1 flex flex-col overflow-hidden">
        <AppContent class="flex-1 overflow-y-auto" />

        <AppFooter />
      </div>
    </div>

    <UploadModal
      v-if="showUploadModal"
      :visible="showUploadModal"
      :categories="store.categories"
      :default-category="store.currentCategory"
      :root-id="store.currentRootId"
      @close="showUploadModal = false"
      @uploaded="handleUploadSuccess"
      @error="(msg: string) => showToast(msg, 'error')"
    />

    <RootManagementModal
      v-model:visible="showRootSettings"
      :all-roots="store.roots"
      @refresh="store.handleRootsUpdated"
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
</template>
