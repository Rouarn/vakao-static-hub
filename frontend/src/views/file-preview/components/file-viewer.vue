<script setup lang="ts">
import { ref, onUnmounted, nextTick, watch, onMounted } from 'vue';
import { createViewer, type ViewerInstance } from 'jit-viewer';
import 'jit-viewer/style.css';
import { NSpin } from 'naive-ui';
import { isImage } from '@/utils/file-types';

interface Props {
  fileUrl: string;
  theme?: 'light' | 'dark';
}

interface Emits {
  (e: 'ready'): void;
  (e: 'load'): void;
  (e: 'error', error: Error): void;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
});
const emit = defineEmits<Emits>();

const viewerRef = ref<HTMLDivElement | null>(null);
let viewerInstance: ViewerInstance | null = null;
let mutationObserver: MutationObserver | null = null;
const loading = ref(false);
const isMounted = ref(false);

const destroyViewer = () => {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  if (viewerInstance) {
    viewerInstance.destroy();
    viewerInstance = null;
  }
};

const triggerFitScreen = () => {
  if (!viewerRef.value) return;

  // 查找适应屏幕的按钮
  const fitBtn = viewerRef.value.querySelector(
    '.jv-image-btn[title="实际大小"]',
  );
  if (fitBtn) {
    (fitBtn as HTMLElement).click();
    return true;
  }
  return false;
};

const initViewer = async () => {
  if (!isMounted.value || !viewerRef.value || !props.fileUrl) return;

  destroyViewer();
  loading.value = true;

  await nextTick();

  try {
    const url = new URL(props.fileUrl);
    const filename = url.pathname.split('/').pop() || 'file';
    const isImageFile = isImage(filename);

    viewerInstance = createViewer({
      target: viewerRef.value,
      file: props.fileUrl,
      filename: filename,
      theme: props.theme,
      toolbar: true,
      width: '100%',
      height: '100%',
      onReady: () => {
        loading.value = false;
        emit('ready');
      },
      onLoad: () => {
        loading.value = false;
        emit('load');

        // 如果是图片，使用 MutationObserver 监听 DOM 变化
        if (isImageFile && viewerRef.value) {
          // 先尝试直接点击
          if (triggerFitScreen()) {
            return;
          }

          // 如果按钮还没出现，使用 MutationObserver 监听
          mutationObserver = new MutationObserver(() => {
            if (triggerFitScreen()) {
              mutationObserver?.disconnect();
              mutationObserver = null;
            }
          });

          mutationObserver.observe(viewerRef.value, {
            childList: true,
            subtree: true,
            attributes: true,
          });

          // 超时保护，500ms 后停止监听
          setTimeout(() => {
            if (mutationObserver) {
              mutationObserver.disconnect();
              mutationObserver = null;
            }
          }, 500);
        }
      },
      onError: (err) => {
        loading.value = false;
        emit('error', err);
      },
    });

    viewerInstance.mount();
  } catch (error) {
    loading.value = false;
    emit(
      'error',
      error instanceof Error ? error : new Error('初始化预览器失败'),
    );
  }
};

onMounted(() => {
  isMounted.value = true;
  if (props.fileUrl) {
    initViewer();
  }
});

watch(
  () => props.fileUrl,
  () => {
    if (isMounted.value && props.fileUrl) {
      initViewer();
    } else if (!props.fileUrl) {
      destroyViewer();
    }
  },
);

watch(
  () => props.theme,
  () => {
    if (isMounted.value && props.fileUrl) {
      initViewer();
    }
  },
);

onUnmounted(() => {
  destroyViewer();
});

defineExpose({
  reload: initViewer,
  destroy: destroyViewer,
});
</script>

<template>
  <div class="w-full h-full relative">
    <div ref="viewerRef" style="width: 100%; height: 100%"></div>
    <div
      v-if="loading"
      class="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10"
    >
      <NSpin :show="loading" size="large">
        <template #description>加载中...</template>
      </NSpin>
    </div>
  </div>
</template>
