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
  BarChartOutline,
  PeopleOutline,
  PieChartOutline,
  ScanOutline,
  GridOutline,
  AppsOutline,
  StatsChartOutline,
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

// 菜单配置：支持分组和二级菜单
interface MenuItem {
  key: string;
  label: string;
  icon?: any;
  children?: MenuItem[];
}

const MENU_CONFIG: MenuItem[] = [
  {
    key: 'group-content',
    label: '内容管理',
    icon: GridOutline,
    children: [
      { key: 'share-links', label: '分享链接', icon: LinkOutline },
      { key: 'app-update', label: 'APP 版本管理', icon: CloudDownloadOutline },
      { key: 'app-update-stats', label: '升级漏斗统计', icon: BarChartOutline },
    ],
  },
  {
    key: 'group-analysis',
    label: '数据分析',
    icon: StatsChartOutline,
    children: [
      { key: 'storage-stats', label: '存储统计', icon: PieChartOutline },
      { key: 'duplicate-files', label: '重复文件检测', icon: ScanOutline },
    ],
  },
  {
    key: 'group-system',
    label: '系统管理',
    icon: SettingsOutline,
    children: [
      { key: 'user-management', label: '用户管理', icon: PeopleOutline },
      { key: 'api-docs', label: 'API 接口文档', icon: CodeSlashOutline },
    ],
  },
  {
    key: 'group-tools',
    label: '实用工具',
    icon: AppsOutline,
    children: [
      { key: 'local-file-preview', label: '文件预览', icon: EyeOutline },
      {
        key: 'placeholder-generator',
        label: '占位图生成',
        icon: ApertureOutline,
      },
      { key: 'hitokoto', label: '一言', icon: SparklesOutline },
    ],
  },
];

// 扁平化所有菜单项用于路由匹配
const ALL_MENUS = computed(() => {
  const flat: MenuItem[] = [];
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      flat.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(MENU_CONFIG);
  return flat;
});

const rootOptions = computed(() =>
  store.roots.map((r) => ({ label: r.name, value: r.id })),
);

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = computed(() => {
  // 资源分类组（动态）
  const categoryGroup = {
    key: 'group-categories',
    label: '资源分类',
    type: 'group' as const,
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
  };

  // 系统功能组（静态配置），与资源分类一致使用 group 小标题样式
  const systemGroups = MENU_CONFIG.map((group) => ({
    key: group.key,
    label: group.label,
    type: 'group' as const,
    children: group.children?.map((item) => ({
      key: item.key,
      label: item.label,
      icon: renderIcon(item.icon),
    })),
  }));

  return [categoryGroup, ...systemGroups];
});

const menuValue = computed(() => {
  const menu = ALL_MENUS.value.find((m) => m.key === route.name);
  return menu ? menu.key : `cat:${store.currentCategory}`;
});

function handleMenuSelect(key: string) {
  if (key === menuValue.value) return;

  const menu = ALL_MENUS.value.find((m) => m.key === key);
  if (menu) {
    router.push({ name: menu.key });
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
        default-expand-all
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
