<script setup lang="ts">
/**
 * 文件上传模态框
 * 支持多文件选择、拖拽上传
 * 显示上传进度和状态
 */
import { computed, ref, watch } from 'vue';
import { NModal, NButton, NIcon, NAutoComplete, NSpace } from 'naive-ui';
import {
  FolderOutline,
  CloudUploadOutline,
  DocumentOutline,
} from '@vicons/ionicons5';
import { uploadFile } from '@/service/api/files';

interface UploadItem {
  file: File;
  progress: number;
  error: boolean;
  errorMessage?: string;
  relativePath?: string;
}

const props = defineProps<{
  visible: boolean;
  categories: string[];
  defaultCategory: string;
  rootId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'uploaded', category: string): void;
  (e: 'error', message: string): void;
}>();

const uploadCategoryInput = ref('');
const uploadItems = ref<UploadItem[]>([]);
const isDragOver = ref(false);
const autoCompleteForceOpen = ref(false);
const isInputFocused = ref(false);

const canUpload = computed(
  () =>
    uploadItems.value.length > 0 &&
    !uploadItems.value.some((f) => f.progress > 0 && f.progress < 100),
);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      uploadCategoryInput.value = '';
      uploadItems.value = [];
      isDragOver.value = false;
      autoCompleteForceOpen.value = false;
    }
  },
);

function handleCategoryClick() {
  autoCompleteForceOpen.value = true;
}

function handleCategoryBlur() {
  autoCompleteForceOpen.value = false;
}

function getShowAutoComplete(value: string) {
  return (
    autoCompleteForceOpen.value || (isInputFocused.value && value.length > 0)
  );
}

function close() {
  emit('close');
}

/**
 * 添加文件到上传队列
 */
function addUploadFiles(
  files: (File | { file: File; relativePath: string })[],
) {
  files.forEach((item) => {
    const file = item instanceof File ? item : item.file;
    const relativePath = item instanceof File ? '' : item.relativePath;
    uploadItems.value.push({
      file,
      progress: 0,
      error: false,
      relativePath,
    });
  });
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    addUploadFiles(Array.from(target.files));
    target.value = '';
  }
}

/**
 * 处理文件拖放
 * 支持多文件、文件夹拖拽
 * 如果是单个文件夹，自动设置分类路径
 * 如果是多个文件/文件夹，递归读取并添加到上传列表
 */
async function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
  isInputFocused.value = false;

  const items = event.dataTransfer?.items;
  if (items && items.length > 0) {
    await processDroppedItems(items);
  } else if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    addUploadFiles(Array.from(event.dataTransfer.files));
  }
}

/**
 * 处理拖放的文件项
 * 递归读取文件夹内容
 */
async function processDroppedItems(items: DataTransferItemList) {
  const entries: any[] = [];
  // 遍历 DataTransferItemList 获取文件入口
  for (let i = 0; i < items.length; i++) {
    // webkitGetAsEntry 是非标准 API，但在 Chrome/Edge/Firefox 等现代浏览器中支持
    const entry = items[i]?.webkitGetAsEntry()
      ? items[i]?.webkitGetAsEntry()
      : null;
    if (entry) {
      entries.push(entry);
    }
  }

  if (entries.length === 0) {
    return;
  }

  const results: { file: File; relativePath: string }[] = [];
  // 检查是否只拖入了一个文件夹
  const isSingleDir = entries.length === 1 && entries[0].isDirectory;

  if (isSingleDir) {
    const dirName = entries[0].name;
    // 自动设置分类路径：当前输入框内容 + 拖入的文件夹名
    const current =
      uploadCategoryInput.value.trim() || props.defaultCategory || '';
    const separator = current && !current.endsWith('/') ? '/' : '';
    uploadCategoryInput.value = current
      ? `${current}${separator}${dirName}`
      : dirName;

    // 读取该文件夹下的所有内容
    const reader = entries[0].createReader();
    const readAllChildren = async () => {
      let allEntries: any[] = [];
      let done = false;
      while (!done) {
        const batch = await new Promise<any[]>((resolve) =>
          reader.readEntries(resolve),
        );
        if (batch.length === 0) {
          done = true;
        } else {
          allEntries = allEntries.concat(batch);
        }
      }
      return allEntries;
    };
    const children = await readAllChildren();
    for (const child of children) {
      // 这里的 relativePath 为空，因为文件直接位于该分类下（分类名已包含文件夹名）
      await traverseEntry(child, '', results);
    }
  } else {
    // 多个文件/文件夹拖入，保留目录结构
    for (const entry of entries) {
      const initialPath = entry.isDirectory ? entry.name : '';
      await traverseEntry(entry, initialPath, results);
    }
  }

  addUploadFiles(results);
}

/**
 * 递归遍历文件入口
 * @param entry 文件系统入口 (FileEntry | DirectoryEntry)
 * @param parentDir 当前文件的父级相对路径
 * @param results 结果收集数组
 */
async function traverseEntry(
  entry: any,
  parentDir: string,
  results: { file: File; relativePath: string }[],
) {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      entry.file(resolve, reject),
    );
    results.push({ file, relativePath: parentDir });
  } else if (entry.isDirectory) {
    const currentDir = parentDir ? `${parentDir}/${entry.name}` : entry.name;
    const reader = entry.createReader();
    const readAll = async () => {
      let allEntries: any[] = [];
      let done = false;
      while (!done) {
        // readEntries 可能不会一次返回所有文件，需要循环读取
        const batch = await new Promise<any[]>((resolve) =>
          reader.readEntries(resolve),
        );
        if (batch.length === 0) {
          done = true;
        } else {
          allEntries = allEntries.concat(batch);
        }
      }
      return allEntries;
    };

    const children = await readAll();
    for (const child of children) {
      await traverseEntry(child, currentDir, results);
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
}

function removeUploadItem(index: number) {
  uploadItems.value.splice(index, 1);
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件的完整上传路径
 */
function getDisplayPath(item: UploadItem) {
  const baseCategory =
    uploadCategoryInput.value.trim() ||
    props.defaultCategory ||
    'TemporaryFile';

  let finalCategory = baseCategory;
  if (item.relativePath) {
    finalCategory = baseCategory.endsWith('/')
      ? `${baseCategory}${item.relativePath}`
      : `${baseCategory}/${item.relativePath}`;
  }

  const separator = finalCategory.endsWith('/') ? '' : '/';
  return `${finalCategory}${separator}${item.file.name}`;
}

async function handleUpload() {
  if (!uploadItems.value.length) {
    emit('error', '请选择文件');
    return;
  }

  const baseCategory =
    uploadCategoryInput.value.trim() ||
    props.defaultCategory ||
    'TemporaryFile';

  if (!baseCategory) {
    emit('error', '请输入或选择分类');
    return;
  }

  try {
    let successCount = 0;
    let failCount = 0;

    const promises = uploadItems.value.map((item, index) => {
      let finalCategory = baseCategory;
      if (item.relativePath) {
        finalCategory = baseCategory.endsWith('/')
          ? `${baseCategory}${item.relativePath}`
          : `${baseCategory}/${item.relativePath}`;
      }

      return uploadFile(props.rootId, finalCategory, item.file, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const percent = (e.loaded / e.total) * 100;
          const currentItem = uploadItems.value[index];
          if (currentItem) {
            currentItem.progress = percent;
          }
        },
      })
        .then(() => {
          successCount++;
        })
        .catch((err: any) => {
          failCount++;
          const currentItem = uploadItems.value[index];
          if (currentItem) {
            currentItem.error = true;
            currentItem.progress = 100;
            if (err.response && err.response.status === 413) {
              currentItem.errorMessage = '文件过大';
            } else {
              currentItem.errorMessage =
                err.response?.data?.message || '上传失败';
            }
          }
        });
    });

    await Promise.all(promises);

    if (failCount > 0) {
      emit('error', `上传完成：${successCount} 个成功，${failCount} 个失败`);
    } else {
      const firstLevelCategory = baseCategory.includes('/')
        ? baseCategory.split('/')[0]
        : baseCategory;
      emit('uploaded', firstLevelCategory || '');
    }
  } catch {
    emit('error', '系统错误');
  }
}
</script>

<template>
  <n-modal
    :show="props.visible"
    preset="card"
    title="上传文件"
    :mask-closable="false"
    style="max-width: 640px"
    @update:show="
      (value) => {
        if (!value) close();
      }
    "
  >
    <div class="mb-4">
      <label class="block mb-2 text-sm font-medium text-base"> 选择分类 </label>
      <n-auto-complete
        v-model:value="uploadCategoryInput"
        :options="props.categories"
        :get-show="getShowAutoComplete"
        :placeholder="props.defaultCategory || '选择或输入新分类'"
        @click="handleCategoryClick"
        @focus="isInputFocused = true"
        @blur="handleCategoryBlur"
      >
        <template #prefix>
          <NIcon>
            <FolderOutline />
          </NIcon>
        </template>
      </n-auto-complete>
    </div>
    <div
      id="dropZone"
      class="mt-4 border-2 border-dashed border-base rounded-xl px-8 py-8 text-center cursor-pointer transition-all"
      :class="
        isDragOver
          ? 'border-primary bg-primary/10'
          : 'hover:border-primary hover:bg-container'
      "
      @click="
        ($event.target as HTMLElement).id === 'fileInput'
          ? null
          : ($refs.fileInput as HTMLInputElement).click()
      "
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <NIcon size="32">
        <CloudUploadOutline />
      </NIcon>
      <p class="mt-2 text-sm text-gray-500">点击或拖拽文件到此处</p>
      <input
        id="fileInput"
        ref="fileInput"
        type="file"
        multiple
        hidden
        @change="handleFileInputChange"
      />
    </div>
    <div
      id="selectedFileList"
      class="mt-3 flex flex-col gap-2 max-h-52 overflow-y-auto"
      :class="!uploadItems.length ? 'hidden' : ''"
    >
      <div
        v-for="(item, index) in uploadItems"
        :key="item.file.name + index"
        class="relative flex items-center gap-3 bg-container px-3 py-2 rounded-lg overflow-hidden shrink-0"
      >
        <div
          class="absolute inset-y-0 left-0 w-0 bg-primary/20 pointer-events-none transition-[width] duration-100"
          :style="{
            width: `${item.progress}%`,
            backgroundColor: item.error ? 'rgba(239, 68, 68, 0.3)' : undefined,
          }"
        />
        <NIcon class="text-gray-500">
          <DocumentOutline />
        </NIcon>
        <NSpace :size="0" class="flex-1">
          <span class="text-sm truncate text-base">{{ item.file.name }}</span>
          <span class="ml-2 text-xs text-gray-500">
            {{ formatFileSize(item.file.size) }}
          </span>
          <span class="text-xs text-gray-500 truncate mt-0.5 ml-2">
            {{ getDisplayPath(item) }}
          </span>
          <span
            v-if="item.error && item.errorMessage"
            class="text-xs text-red-500 truncate mt-0.5 ml-2"
          >
            {{ item.errorMessage }}
          </span>
        </NSpace>
        <n-button
          quaternary
          size="small"
          :disabled="item.progress > 0 && item.progress < 100"
          @click.stop="removeUploadItem(index)"
        >
          移除
        </n-button>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button @click="close"> 取消 </n-button>
        <n-button type="primary" :disabled="!canUpload" @click="handleUpload">
          开始上传
        </n-button>
      </div>
    </template>
  </n-modal>
</template>
