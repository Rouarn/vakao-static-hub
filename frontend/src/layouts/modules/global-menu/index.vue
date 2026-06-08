<script setup lang="ts">
/**
 * 侧边栏组件
 * 显示分类菜单和系统功能入口
 * 支持根目录切换
 */
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
} from '@vicons/ionicons5';
import type { ResourceRoot } from '@/service/api/files';

const route = useRoute();
const router = useRouter();

const props = defineProps<{
  categories: string[];
  currentCategory: string;
  roots: ResourceRoot[];
  currentRootId: string;
}>();

const emit = defineEmits<{
  (e: 'selectCategory', category: string): void;
  (e: 'update:currentRootId', id: string): void;
  (e: 'openSettings'): void;
}>();

/** 系统功能菜单配置 */
const SYSTEM_MENUS = [
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
  props.roots.map((r) => ({ label: r.name, value: r.id })),
);

/**
 * 构造菜单选项
 */
const menuOptions = computed(() => [
  {
    key: 'group-categories',
    label: '资源分类',
    type: 'group',
    children: props.categories.map((cat) => ({
      key: `cat:${cat}`,
      label: cat,
      icon: () =>
        h(NIcon, null, {
          default: () =>
            h(
              cat === props.currentCategory ? FolderOpenOutline : FolderOutline,
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
  return systemMenu ? systemMenu.key : `cat:${props.currentCategory}`;
});

function handleMenuSelect(key: string) {
  if (key === menuValue.value) return;

  const systemMenu = SYSTEM_MENUS.find((m) => m.key === key);
  if (systemMenu) {
    router.push({ name: systemMenu.key });
  } else if (key.startsWith('cat:')) {
    emit('selectCategory', key.slice(4));
  }
}
</script>

<template>
  <aside class="h-full flex flex-col bg-base border-r border-base">
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

    <!-- Bottom Fixed Section -->
    <div
      class="mt-auto flex items-center gap-2 border-t border-base bg-container p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
    >
      <NSelect
        :value="props.currentRootId"
        :options="rootOptions"
        size="small"
        placeholder="选择存储库"
        class="flex-1"
        @update:value="(val) => emit('update:currentRootId', val)"
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
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
