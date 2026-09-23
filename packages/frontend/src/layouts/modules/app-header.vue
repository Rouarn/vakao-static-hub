<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NIcon, NDropdown, type DropdownOption } from 'naive-ui';
import {
  MenuOutline,
  CloudOutline,
  RefreshOutline,
  CloudUploadOutline,
  PersonCircleOutline,
  LogOutOutline,
  MoonOutline,
  SunnyOutline,
  EllipsisHorizontalOutline,
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

const mobileMenuOptions = computed<DropdownOption[]>(() => [
  {
    key: 'user-info',
    type: 'render',
    render: () =>
      h(
        'div',
        { class: 'flex items-center gap-2 px-2 py-1 text-sm text-base' },
        [
          h(NIcon, { size: 18 }, { default: () => h(PersonCircleOutline) }),
          h('span', authStore.userInfo?.username || '用户'),
        ],
      ),
  },
  { type: 'divider', key: 'divider-user' },
  {
    key: 'refresh',
    label: '刷新缓存',
    icon: () => h(NIcon, null, { default: () => h(RefreshOutline) }),
  },
  {
    key: 'theme',
    label: isDark.value ? '切换到浅色模式' : '切换到深色模式',
    icon: () =>
      h(NIcon, null, {
        default: () => h(isDark.value ? SunnyOutline : MoonOutline),
      }),
  },
  { type: 'divider', key: 'divider-actions' },
  {
    key: 'logout',
    label: '退出登录',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
    props: { style: 'color: #d03050;' },
  },
]);

function handleMobileMenuSelect(key: string) {
  switch (key) {
    case 'refresh':
      emit('refreshCache');
      break;
    case 'theme':
      toggleDark();
      break;
    case 'logout':
      emit('logout');
      break;
  }
}
</script>

<template>
  <header
    class="flex w-full items-center justify-between bg-base px-3 sm:px-6 z-10 border-b border-base"
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
        class="hidden text-gray-500 hover:bg-container transition-all sm:inline-flex"
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
        class="hidden border border-base text-gray-500 hover:bg-container transition-all sm:inline-flex"
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

      <div
        class="hidden items-center gap-2 border-l border-base pl-4 ml-2 sm:flex"
      >
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

      <NDropdown
        :options="mobileMenuOptions"
        trigger="click"
        placement="bottom-end"
        @select="handleMobileMenuSelect"
      >
        <NButton
          quaternary
          circle
          class="text-gray-500 hover:bg-container transition-all sm:hidden"
          title="更多操作"
        >
          <template #icon>
            <NIcon><EllipsisHorizontalOutline /></NIcon>
          </template>
        </NButton>
      </NDropdown>
    </div>
  </header>
</template>
