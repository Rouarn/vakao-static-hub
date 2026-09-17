<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui';
import {
  MenuOutline,
  CloudOutline,
  RefreshOutline,
  CloudUploadOutline,
  PersonCircleOutline,
  LogOutOutline,
  MoonOutline,
  SunnyOutline,
} from '@vicons/ionicons5';
import { useDark, useToggle } from '@vueuse/core';
import { useAuthStore } from '@/stores/modules/auth';

const isDark = useDark();
const toggleDark = useToggle(isDark);

const authStore = useAuthStore();

const emit = defineEmits<{
  (e: 'toggleSidebar'): void;
  (e: 'refreshCache'): void;
  (e: 'openUploadModal'): void;
  (e: 'logout'): void;
}>();
</script>

<template>
  <header
    class="flex w-full items-center justify-between bg-base px-6 z-10 border-b border-base"
  >
    <div class="flex items-center gap-3">
      <NButton
        quaternary
        circle
        size="small"
        class="md:hidden"
        @click="emit('toggleSidebar')"
      >
        <template #icon>
          <NIcon><MenuOutline /></NIcon>
        </template>
      </NButton>
      <div class="flex items-center gap-2 text-lg font-semibold text-base">
        <NIcon size="24" class="text-primary">
          <CloudOutline />
        </NIcon>
        <span>StaticHub</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 sm:gap-4">
      <NButton
        quaternary
        circle
        class="text-gray-500 hover:bg-container transition-all"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
        @click="toggleDark()"
      >
        <template #icon>
          <NIcon>
            <MoonOutline v-if="isDark" />
            <SunnyOutline v-else />
          </NIcon>
        </template>
      </NButton>

      <NButton
        quaternary
        class="border border-base text-gray-500 hover:bg-container transition-all"
        title="刷新文件缓存"
        @click="emit('refreshCache')"
      >
        <template #icon>
          <NIcon><RefreshOutline /></NIcon>
        </template>
        <span class="hidden sm:inline">刷新缓存</span>
      </NButton>

      <NButton
        type="primary"
        class="bg-primary hover:bg-primary_hover transition-all"
        @click="emit('openUploadModal')"
      >
        <template #icon>
          <NIcon><CloudUploadOutline /></NIcon>
        </template>
        <span class="hidden sm:inline">上传文件</span>
      </NButton>

      <div class="flex items-center gap-2 border-l border-base pl-4 ml-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <NIcon><PersonCircleOutline /></NIcon>
        </div>
        <span class="hidden sm:inline text-sm font-medium text-base">
          {{ authStore.userInfo?.username || '用户' }}
        </span>
        <NButton
          quaternary
          circle
          size="small"
          title="退出登录"
          @click="emit('logout')"
        >
          <template #icon>
            <NIcon><LogOutOutline /></NIcon>
          </template>
        </NButton>
      </div>
    </div>
  </header>
</template>
