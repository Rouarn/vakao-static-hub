<script setup lang="ts">
import { computed, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NMenu, NIcon, NSelect, NButton } from 'naive-ui';
import {
  FolderOutline,
  FolderOpenOutline,
  CodeSlashOutline,
  SettingsOutline,
  ApertureOutline,
  SparklesOutline,
  EyeOutline,
  LinkOutline,
  CloudDownloadOutline,
} from '@vicons/ionicons5';
import { useFileListStore } from '@/stores/modules/file-list';

const route = useRoute();
const router = useRouter();
const store = useFileListStore();

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'closeSidebar'): void;
  (e: 'openSettings'): void;
}>();

const SYSTEM_MENUS = [
  { key: 'share-links', label: '分享链接 Share Links', icon: LinkOutline },
  { key: 'app-update', label: 'APP 版本管理', icon: CloudDownloadOutline },
  { key: 'api-docs', label: 'API 接口文档', icon: CodeSlashOutline },
  { key: 'local-file-preview', label: '文件预览 Preview', icon: EyeOutline },
  {
    key: 'placeholder-generator',
    label: '占位图 Placeholder',
    icon: ApertureOutline,
  },
  { key: 'hitokoto', label: '一言 hitokoto', icon: SparklesOutline },
] as const;

const rootOptions = computed(() =>
  store.roots.map((r) => ({ label: r.name, value: r.id })),
);

const menuOptions = computed(() => [
  {
    key: 'group-categories',
    label: '资源分类',
    type: 'group',
    children: store.categories.map((cat) => ({
      key: `cat:${cat}`,
      label: cat,
      icon: () =>
        h(NIcon, null, {
          default: () =>
            h(
              cat === store.currentCategory ? FolderOpenOutline : FolderOutline,
            ),
        }),
    })),
  },
  {
    key: 'group-system',
    label: '系统功能',
    type: 'group',
    children: SYSTEM_MENUS.map((item) => ({
      key: item.key,
      label: item.label,
      icon: () => h(NIcon, null, { default: () => h(item.icon) }),
    })),
  },
]);

const menuValue = computed(() => {
  const systemMenu = SYSTEM_MENUS.find((m) => m.key === route.name);
  return systemMenu ? systemMenu.key : `cat:${store.currentCategory}`;
});

function handleMenuSelect(key: string) {
  if (key === menuValue.value) return;

  const systemMenu = SYSTEM_MENUS.find((m) => m.key === key);
  if (systemMenu) {
    router.push({ name: systemMenu.key });
  } else if (key.startsWith('cat:')) {
    store.handleCategoryClick(key.slice(4));
  }
  emit('closeSidebar');
}
</script>

<template>
  <aside
    class="h-full flex flex-col bg-base border-r border-base fixed inset-y-0 left-0 z-20 w-[240px] transition-transform duration-300 md:static md:h-auto"
    :class="
      props.isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    "
  >
    <div class="flex-1 overflow-y-auto py-4 scrollbar-hide">
      <NMenu
        :options="menuOptions"
        :value="menuValue"
        :indent="18"
        :root-indent="18"
        :collapsed-width="48"
        :collapsed-icon-size="18"
        @update:value="handleMenuSelect"
      />
    </div>

    <div
      class="mt-auto flex items-center gap-2 border-t border-base bg-container p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
    >
      <NSelect
        :value="store.currentRootId"
        :options="rootOptions"
        size="small"
        placeholder="选择存储库"
        class="flex-1"
        @update:value="(val: string) => store.handleRootChange(val)"
      />
      <NButton
        quaternary
        circle
        size="small"
        title="资源目录管理"
        @click="emit('openSettings')"
      >
        <template #icon>
          <NIcon>
            <SettingsOutline />
          </NIcon>
        </template>
      </NButton>
    </div>
  </aside>

  <div
    v-show="props.isOpen"
    class="fixed inset-0 z-10 bg-black/50 transition-opacity md:hidden"
    @click="emit('closeSidebar')"
  />
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
