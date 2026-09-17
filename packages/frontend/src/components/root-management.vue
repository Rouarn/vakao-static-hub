<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  NModal,
  NCard,
  NButton,
  NInput,
  NInputGroup,
  NList,
  NListItem,
  NPopconfirm,
  useMessage,
  NSpin,
  NTag,
  NIcon,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NTooltip,
  NBreadcrumb,
  NBreadcrumbItem,
  NScrollbar,
  NDivider,
} from 'naive-ui';
import {
  FolderOpenOutline,
  TrashOutline,
  AddCircleOutline,
  ServerOutline,
  ArrowUpOutline,
  CheckmarkCircleOutline,
  FolderOutline,
  HomeOutline,
  KeyOutline,
  TextOutline,
  CloseCircleOutline,
  CreateOutline,
} from '@vicons/ionicons5';
import {
  addRoot,
  removeRoot,
  updateRoot,
  getSystemDirectories,
} from '@/api/files';
import type { ResourceRoot } from '@vakao/shared';

const props = defineProps<{
  visible: boolean;
  allRoots: ResourceRoot[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
}>();

const roots = computed(() => props.allRoots);
const loading = ref(false);
const message = useMessage();

const showBrowser = ref(false);
const browserPath = ref('');
const browserDirs = ref<any[]>([]);
const browserLoading = ref(false);
const isEditing = ref(false);

const newRoot = ref({
  id: '',
  name: '',
  path: '',
});

async function loadBrowserDirs(path?: string) {
  browserLoading.value = true;
  try {
    const data = await getSystemDirectories(path);
    const result = Array.isArray(data) ? data : [];
    browserDirs.value = result;
    if (path) {
      browserPath.value = path;
    } else {
      if (browserDirs.value.length > 0) {
        const firstPath = browserDirs.value[0].path;
        if (firstPath.includes(':\\')) {
          browserPath.value = '';
        } else if (firstPath.startsWith('/')) {
          browserPath.value = '/';
        }
      }
    }
  } catch {
    message.error('加载目录失败');
  } finally {
    browserLoading.value = false;
  }
}

function openBrowser() {
  showBrowser.value = true;
  loadBrowserDirs(newRoot.value.path || undefined);
}

function handleBrowserEnter(path: string) {
  loadBrowserDirs(path);
  browserPath.value = path;
}

function handleBrowserUp() {
  if (!browserPath.value) return;
  const separator = browserPath.value.includes('/') ? '/' : '\\';
  const parts = browserPath.value.split(separator);

  if (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }

  if (parts.length <= 1 || (parts.length === 2 && parts[1] === '')) {
    loadBrowserDirs(undefined);
    browserPath.value = '';
  } else {
    parts.pop();
    const parent = parts.join(separator) || separator;
    loadBrowserDirs(parent);
    browserPath.value = parent;
  }
}

const pathBreadcrumbs = computed(() => {
  if (!browserPath.value) return [];
  const separator = browserPath.value.includes('/') ? '/' : '\\';
  const parts = browserPath.value.split(separator).filter((p) => p);

  let current = '';
  return parts.map((part) => {
    current +=
      (current && !current.endsWith(separator) ? separator : '') +
      (current === '' && browserPath.value.startsWith('/') ? '/' : '') +
      part;
    if (
      current.includes(':') &&
      !current.includes(separator) &&
      browserPath.value.includes(':')
    ) {
      // Just drive letter
    }

    return {
      name: part,
      path: current,
    };
  });
});

function navigateToBreadcrumb(path: string) {
  loadBrowserDirs(path);
}

function confirmBrowserSelection() {
  if (browserPath.value) {
    newRoot.value.path = browserPath.value;
    showBrowser.value = false;
  }
}

async function handleAdd() {
  if (!newRoot.value.id || !newRoot.value.name || !newRoot.value.path) {
    message.warning('请填写完整信息');
    return;
  }
  loading.value = true;
  try {
    if (isEditing.value) {
      await updateRoot(newRoot.value.id, {
        name: newRoot.value.name,
        path: newRoot.value.path,
      });
      message.success('更新成功');
    } else {
      await addRoot(newRoot.value);
      message.success('添加成功');
    }
    cancelEdit();
    emit('refresh');
  } catch {
    message.error(isEditing.value ? '更新失败' : '添加失败，ID可能已存在');
  } finally {
    loading.value = false;
  }
}

function handleEdit(root: ResourceRoot) {
  isEditing.value = true;
  newRoot.value = { ...root };
}

function cancelEdit() {
  isEditing.value = false;
  newRoot.value = { id: '', name: '', path: '' };
}

async function handleRemove(id: string) {
  try {
    await removeRoot(id);
    message.success('删除成功');
    emit('refresh');
  } catch {
    message.error('删除失败');
  }
}

function handleClose() {
  emit('update:visible', false);
}

onMounted(() => {});
</script>

<template>
  <NModal :show="visible" @update:show="handleClose" class="custom-modal">
    <NCard
      title="多资源目录管理"
      :bordered="false"
      size="large"
      role="dialog"
      aria-modal="true"
      style="width: 700px; max-width: 95vw"
      header-style="padding-bottom: 10px;"
      content-style="padding-top: 0;"
    >
      <template #header-extra>
        <NButton text circle @click="handleClose">
          <template #icon>
            <NIcon><CloseCircleOutline /></NIcon>
          </template>
        </NButton>
      </template>

      <div class="flex flex-col gap-6">
        <div class="bg-container p-3 sm:p-5 rounded-xl border border-base">
          <div class="flex items-center gap-2 mb-4 text-base">
            <NIcon
              :component="isEditing ? CreateOutline : AddCircleOutline"
              class="text-primary"
            />
            <span class="font-medium">
              {{ isEditing ? '编辑资源目录' : '添加新资源目录' }}
            </span>
          </div>

          <NForm
            :model="newRoot"
            label-placement="left"
            label-width="auto"
            size="small"
          >
            <NGrid cols="1 s:2" :x-gap="12" responsive="screen">
              <NGridItem>
                <NFormItem label="唯一标识" path="id">
                  <NInput
                    v-model:value="newRoot.id"
                    placeholder="如: archive"
                    :disabled="isEditing"
                  >
                    <template #prefix>
                      <NIcon :component="KeyOutline" />
                    </template>
                  </NInput>
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="显示名称" path="name">
                  <NInput
                    v-model:value="newRoot.name"
                    placeholder="如: 归档数据"
                  >
                    <template #prefix>
                      <NIcon :component="TextOutline" />
                    </template>
                  </NInput>
                </NFormItem>
              </NGridItem>
            </NGrid>

            <NFormItem label="本地路径" path="path">
              <NInputGroup>
                <NInput
                  v-model:value="newRoot.path"
                  placeholder="服务器绝对路径"
                >
                  <template #prefix>
                    <NIcon :component="FolderOpenOutline" />
                  </template>
                </NInput>
                <NButton type="primary" ghost @click="openBrowser">
                  浏览...
                </NButton>
              </NInputGroup>
            </NFormItem>

            <div class="flex justify-end mt-2 gap-2">
              <NButton v-if="isEditing" size="small" @click="cancelEdit">
                取消
              </NButton>
              <NButton
                type="primary"
                @click="handleAdd"
                :disabled="loading"
                size="small"
              >
                <template #icon>
                  <NIcon :component="CheckmarkCircleOutline" />
                </template>
                {{ isEditing ? '确认修改' : '确认添加' }}
              </NButton>
            </div>
          </NForm>
        </div>

        <NDivider style="margin: 0" />

        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-base flex items-center gap-2">
              <NIcon :component="ServerOutline" />
              已配置目录
            </h3>
            <NTag size="small" round :bordered="false" type="default">
              共 {{ roots.length }} 个
            </NTag>
          </div>

          <div
            class="min-h-[150px] max-h-[300px] overflow-hidden bg-base rounded-lg border border-base shadow-sm relative"
          >
            <NScrollbar style="max-height: 300px">
              <NList hoverable clickable v-if="roots.length > 0">
                <NListItem v-for="root in roots" :key="root.id">
                  <div class="flex items-center gap-2 sm:gap-4 py-1 px-2">
                    <div
                      class="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <NIcon size="22">
                        <FolderOpenOutline />
                      </NIcon>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-base">{{ root.name }}</span>
                        <NTag
                          size="small"
                          :bordered="false"
                          type="info"
                          class="font-mono text-xs px-1.5 h-5"
                        >
                          ID: {{ root.id }}
                        </NTag>
                      </div>
                      <div
                        class="text-xs text-gray-500 font-mono truncate bg-container px-2 py-0.5 rounded border border-base inline-block max-w-full"
                        :title="root.path"
                      >
                        {{ root.path }}
                      </div>
                    </div>

                    <div class="flex-shrink-0 flex items-center gap-1">
                      <NTooltip trigger="hover">
                        <template #trigger>
                          <NButton
                            size="small"
                            type="primary"
                            quaternary
                            circle
                            @click="handleEdit(root)"
                            :disabled="
                              root.id === 'default' ||
                              root.id === 'software-update'
                            "
                          >
                            <template #icon>
                              <NIcon><CreateOutline /></NIcon>
                            </template>
                          </NButton>
                        </template>
                        {{
                          root.id === 'default' || root.id === 'software-update'
                            ? '默认目录不可编辑'
                            : '编辑'
                        }}
                      </NTooltip>

                      <NPopconfirm
                        @positive-click="() => handleRemove(root.id)"
                        negative-text="取消"
                        positive-text="确定"
                      >
                        <template #trigger>
                          <NTooltip trigger="hover">
                            <template #trigger>
                              <NButton
                                size="small"
                                type="error"
                                quaternary
                                circle
                                :disabled="root.id === 'default'"
                              >
                                <template #icon>
                                  <NIcon><TrashOutline /></NIcon>
                                </template>
                              </NButton>
                            </template>
                            {{
                              root.id === 'default'
                                ? '默认目录不可删除'
                                : '删除此目录'
                            }}
                          </NTooltip>
                        </template>
                        确定要删除目录 "{{ root.name }}" 吗？
                      </NPopconfirm>
                    </div>
                  </div>
                </NListItem>
              </NList>

              <div
                v-else
                class="py-12 flex flex-col items-center justify-center text-gray-400"
              >
                <NEmpty description="暂无额外配置目录">
                  <template #icon>
                    <NIcon :component="FolderOutline" />
                  </template>
                </NEmpty>
              </div>
            </NScrollbar>

            <div
              v-if="loading"
              class="absolute inset-0 bg-base/50 flex items-center justify-center z-10"
            >
              <NSpin size="medium" />
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </NModal>

  <NModal
    v-model:show="showBrowser"
    preset="card"
    title="选择服务器目录"
    style="width: 600px; max-width: 90vw"
    :bordered="false"
    size="medium"
  >
    <div class="flex flex-col h-[450px]">
      <div
        class="flex items-center gap-2 mb-3 bg-container p-2 rounded border border-base"
      >
        <NButton
          size="small"
          @click="handleBrowserUp"
          :disabled="!browserPath"
          quaternary
          circle
        >
          <template #icon>
            <NIcon><ArrowUpOutline /></NIcon>
          </template>
        </NButton>
        <NButton
          size="small"
          @click="loadBrowserDirs(undefined)"
          quaternary
          circle
          title="根目录"
        >
          <template #icon>
            <NIcon><HomeOutline /></NIcon>
          </template>
        </NButton>
        <div class="flex-1 mx-2 overflow-x-auto whitespace-nowrap">
          <NBreadcrumb separator=">">
            <NBreadcrumbItem @click="loadBrowserDirs(undefined)">
              <NIcon
                :component="ServerOutline"
                class="mr-1 relative top-[1px]"
              />
              Root
            </NBreadcrumbItem>
            <NBreadcrumbItem
              v-for="(crumb, index) in pathBreadcrumbs"
              :key="index"
              @click="navigateToBreadcrumb(crumb.path)"
            >
              {{ crumb.name }}
            </NBreadcrumbItem>
          </NBreadcrumb>
        </div>
      </div>

      <div
        class="flex-1 overflow-hidden border border-base rounded-lg mb-4 bg-base relative"
      >
        <NSpin
          :show="browserLoading"
          class="h-full"
          content-style="height: 100%"
        >
          <NScrollbar style="height: 100%">
            <NList hoverable clickable>
              <NListItem
                v-for="dir in browserDirs"
                :key="dir.path"
                @click="handleBrowserEnter(dir.path)"
                class="transition-colors duration-200"
              >
                <div class="flex items-center gap-3 px-3 py-2">
                  <NIcon size="20" class="text-yellow-500 flex-shrink-0">
                    <FolderOutline />
                  </NIcon>
                  <span class="flex-1 truncate font-medium text-base">{{
                    dir.name
                  }}</span>
                  <NIcon size="16" class="text-gray-300 dark:text-gray-600">
                    <FolderOpenOutline />
                  </NIcon>
                </div>
              </NListItem>

              <div
                v-if="browserDirs.length === 0 && !browserLoading"
                class="h-full flex flex-col items-center justify-center text-gray-400 py-10"
              >
                <NIcon size="48" class="mb-2 opacity-50"
                  ><FolderOutline
                /></NIcon>
                <span>此目录下无子目录</span>
              </div>
            </NList>
          </NScrollbar>
        </NSpin>
      </div>

      <div
        class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 bg-container -mx-6 -mb-6 px-4 sm:px-6 py-4 mt-0 border-t border-base"
      >
        <div
          class="text-xs text-gray-500 w-full sm:max-w-[60%] truncate order-2 sm:order-1 text-center sm:text-left"
          :title="browserPath"
        >
          当前: {{ browserPath || '未选择' }}
        </div>
        <div class="flex gap-3 order-1 sm:order-2">
          <NButton class="flex-1 sm:flex-none" @click="showBrowser = false"
            >取消</NButton
          >
          <NButton
            class="flex-1 sm:flex-none"
            type="primary"
            @click="confirmBrowserSelection"
            :disabled="!browserPath"
          >
            选择此目录
          </NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.custom-modal :deep(.n-card-header) {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--n-border-color);
}
.custom-modal :deep(.n-list-item) {
  padding: 0;
}
</style>
