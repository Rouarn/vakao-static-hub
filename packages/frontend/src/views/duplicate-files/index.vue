<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  useMessage,
  useDialog,
  NCard,
  NButton,
  NIcon,
  NSpin,
  NEmpty,
  NTag,
  NCheckbox,
} from 'naive-ui';
import { RefreshOutline, TrashOutline, ScanOutline } from '@vicons/ionicons5';
import { getDuplicates, deleteFile } from '@/api/files';
import type { DuplicateScanResult } from '@vakao/shared';
import { formatSize } from '@/utils/format';

defineOptions({
  name: 'duplicate-files',
});

const message = useMessage();
const dialog = useDialog();
const loading = ref(false);
const result = ref<DuplicateScanResult | null>(null);

const savableSize = computed(() => {
  if (!result.value) return 0;
  // 每组保留一份，其余删除，可节省空间 = 每组大小 * (数量 - 1)
  return result.value.groups.reduce(
    (sum, g) => sum + g.size * (g.count - 1),
    0,
  );
});

async function load() {
  loading.value = true;
  try {
    result.value = await getDuplicates();
    if (result.value.hashedCount > 0) {
      message.success(`本次补算 ${result.value.hashedCount} 个文件的哈希`);
    }
  } catch {
    message.error('重复文件检测失败');
  } finally {
    loading.value = false;
  }
}

function hashShort(hash: string) {
  return hash.slice(0, 8);
}

const selectedKeys = ref<Set<string>>(new Set());

function toggleSelect(hash: string, relPath: string, checked: boolean) {
  const key = `${hash}::${relPath}`;
  if (checked) selectedKeys.value.add(key);
  else selectedKeys.value.delete(key);
}

function isSelected(hash: string, relPath: string) {
  return selectedKeys.value.has(`${hash}::${relPath}`);
}

function handleDelete(
  hash: string,
  file: {
    rootId: string;
    category: string;
    relPath: string;
    name: string;
  },
) {
  const d = dialog.warning({
    title: '确认删除',
    content: `确定删除重复副本「${file.name}」？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      d.loading = true;
      try {
        await deleteFile(file.rootId, file.category, file.relPath);
        message.success('删除成功');
        // 从当前结果中移除已删除项，无需重新全量扫描
        const group = result.value?.groups.find((g) => g.contentHash === hash);
        if (group) {
          group.files = group.files.filter((f) => f.relPath !== file.relPath);
          group.count = group.files.length;
          if (group.count <= 1) {
            result.value!.groups = result.value!.groups.filter(
              (g) => g.contentHash !== hash,
            );
            result.value!.groupCount = result.value!.groups.length;
          }
          result.value!.duplicateFileCount = result.value!.groups.reduce(
            (sum, g) => sum + g.count,
            0,
          );
        }
      } catch {
        message.error('删除失败');
      } finally {
        d.loading = false;
      }
    },
  });
}

function handleBatchDelete(hash: string) {
  const group = result.value?.groups.find((g) => g.contentHash === hash);
  if (!group) return;
  const toDelete = group.files.filter((f) => isSelected(hash, f.relPath));
  if (toDelete.length === 0) {
    message.warning('请先勾选要删除的文件');
    return;
  }
  const d = dialog.warning({
    title: '确认批量删除',
    content: `确定删除选中的 ${toDelete.length} 个重复副本？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      d.loading = true;
      let successCount = 0;
      for (const f of toDelete) {
        try {
          await deleteFile(f.rootId, f.category, f.relPath);
          successCount++;
        } catch {
          // 单条失败继续
        }
      }
      group.files = group.files.filter((f) => !isSelected(hash, f.relPath));
      group.count = group.files.length;
      if (group.count <= 1) {
        result.value!.groups = result.value!.groups.filter(
          (g) => g.contentHash !== hash,
        );
        result.value!.groupCount = result.value!.groups.length;
      }
      result.value!.duplicateFileCount = result.value!.groups.reduce(
        (sum, g) => sum + g.count,
        0,
      );
      selectedKeys.value.clear();
      message.success(`成功删除 ${successCount} 个文件`);
      d.loading = false;
    },
  });
}

onMounted(load);
</script>

<template>
  <main class="px-4 md:px-6 pb-4">
    <div
      class="flex items-center justify-between py-4 mb-4 sticky top-0 z-2 bg-container/95 backdrop-blur border-b border-base shadow-sm -mx-4 md:-mx-6 px-4 md:px-6"
    >
      <div class="flex items-center gap-2">
        <NIcon size="22" class="text-primary">
          <ScanOutline />
        </NIcon>
        <h2 class="text-xl font-semibold text-base">重复文件检测</h2>
      </div>
      <NButton quaternary circle title="刷新" :loading="loading" @click="load">
        <template #icon>
          <NIcon><RefreshOutline /></NIcon>
        </template>
      </NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="result" class="flex flex-col gap-4">
        <!-- 统计概览 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NCard size="small" class="text-center">
            <div class="text-2xl font-bold text-primary">
              {{ result.groupCount }}
            </div>
            <div class="text-xs text-gray-500 mt-1">重复组数</div>
          </NCard>
          <NCard size="small" class="text-center">
            <div class="text-2xl font-bold text-primary">
              {{ result.duplicateFileCount }}
            </div>
            <div class="text-xs text-gray-500 mt-1">重复文件数</div>
          </NCard>
          <NCard size="small" class="text-center">
            <div class="text-2xl font-bold text-error">
              {{ formatSize(savableSize) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">预估可节省</div>
          </NCard>
          <NCard size="small" class="text-center">
            <div class="text-2xl font-bold text-primary">
              {{ result.hashedCount }}
            </div>
            <div class="text-xs text-gray-500 mt-1">本次补算哈希</div>
          </NCard>
        </div>

        <!-- 重复组列表 -->
        <div v-if="result.groups.length" class="flex flex-col gap-3">
          <NCard
            v-for="group in result.groups"
            :key="group.contentHash"
            size="small"
            :title="`哈希 ${hashShort(group.contentHash)} · ${formatSize(group.size)} · ${group.count} 个副本`"
          >
            <template #header-extra>
              <NButton
                v-if="
                  group.files.some((f) =>
                    isSelected(group.contentHash, f.relPath),
                  )
                "
                size="small"
                type="error"
                ghost
                @click="handleBatchDelete(group.contentHash)"
              >
                <template #icon>
                  <NIcon><TrashOutline /></NIcon>
                </template>
                删除选中
              </NButton>
            </template>

            <div class="flex flex-col gap-2">
              <div
                v-for="file in group.files"
                :key="file.relPath"
                class="flex items-center gap-3 py-1.5 border-t border-base first:border-t-0"
              >
                <NCheckbox
                  :checked="isSelected(group.contentHash, file.relPath)"
                  @update:checked="
                    (v) => toggleSelect(group.contentHash, file.relPath, v)
                  "
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-base truncate" :title="file.name">
                    {{ file.name }}
                  </div>
                  <div
                    class="text-xs text-gray-500 truncate"
                    :title="`${file.rootId}/${file.category}/${file.relPath}`"
                  >
                    {{ file.rootId }} / {{ file.category }} / {{ file.relPath }}
                  </div>
                </div>
                <NTag size="small" :bordered="false">{{
                  formatSize(file.size)
                }}</NTag>
                <NButton
                  size="tiny"
                  type="error"
                  ghost
                  @click="handleDelete(group.contentHash, file)"
                >
                  <template #icon>
                    <NIcon><TrashOutline /></NIcon>
                  </template>
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <NEmpty v-else description="未发现重复文件" class="py-16" />
      </div>

      <NEmpty v-else-if="!loading" description="暂无数据" class="py-16" />
    </NSpin>
  </main>
</template>
