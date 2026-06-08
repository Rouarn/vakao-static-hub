import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isSupported } from '@/utils/file-types';

export function useFilePreview() {
  const route = useRoute();
  const router = useRouter();

  const fileUrl = ref('');
  const inputUrl = ref('');
  const isShowToolbar = ref(true);
  const loadError = ref(false);
  const errorMessage = ref('');
  const hasPreview = ref(false);
  const reloadTrigger = ref(0);

  const supported = computed(() => {
    if (!fileUrl.value) return false;
    try {
      const url = new URL(fileUrl.value);
      const pathname = url.pathname;
      return isSupported(pathname);
    } catch {
      return false;
    }
  });

  const updateFromRoute = () => {
    const { file, hasToolbar } = route.query;
    const routeName = route.name as string;

    // 根据路由名称决定是否显示工具栏
    if (hasToolbar !== undefined) {
      // 如果有查询参数，优先使用查询参数
      isShowToolbar.value = hasToolbar !== 'false';
    } else {
      // 否则根据路由名称判断
      // file-preview 是外部预览，默认不显示工具栏
      // local-file-preview 是内部预览，默认显示工具栏
      isShowToolbar.value = routeName !== 'file-preview';
    }

    if (typeof file === 'string' && file) {
      // 重置状态
      loadError.value = false;
      errorMessage.value = '';
      hasPreview.value = false;
      fileUrl.value = file;
      inputUrl.value = file;
    }
  };

  const handlePreview = () => {
    if (!inputUrl.value) return;

    if (inputUrl.value !== fileUrl.value) {
      // 新的 URL，更新路由
      void router.replace({ query: { file: inputUrl.value } });
    } else {
      // 相同的 URL，强制重新加载
      loadError.value = false;
      errorMessage.value = '';
      hasPreview.value = false;
      reloadTrigger.value++;
    }
  };

  const handleClear = () => {
    fileUrl.value = '';
    inputUrl.value = '';
    hasPreview.value = false;
    loadError.value = false;
    errorMessage.value = '';
    void router.replace({ query: {} });
  };

  const handleError = (err: Error) => {
    loadError.value = true;
    errorMessage.value = err.message || '加载文档失败';
    hasPreview.value = false;
  };

  const handleReady = () => {
    loadError.value = false;
    errorMessage.value = '';
    hasPreview.value = true;
  };

  const handleLoad = () => {
    loadError.value = false;
    errorMessage.value = '';
    hasPreview.value = true;
  };

  // 监听路由变化
  watch(
    () => [route.query.file, route.query.hasToolbar],
    () => {
      updateFromRoute();
    },
    { immediate: true },
  );

  return {
    fileUrl,
    inputUrl,
    isShowToolbar,
    loadError,
    errorMessage,
    hasPreview,
    supported,
    reloadTrigger,
    handlePreview,
    handleClear,
    handleError,
    handleReady,
    handleLoad,
  };
}
