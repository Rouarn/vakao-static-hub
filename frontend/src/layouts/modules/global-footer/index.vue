<script setup lang="ts">
/**
 * 页脚组件
 * 显示版权信息和项目链接
 */
import { NLayoutFooter } from 'naive-ui';
import { getApiBaseUrl } from '@/utils/env';

const baseURL = getApiBaseUrl();

defineProps<{
  year: number;
  rootId: string;
  category: string;
}>();
</script>

<template>
  <NLayoutFooter
    class="flex items-center justify-between bg-base px-6 py-3 text-xs text-gray-500 border-t border-base"
  >
    <span>&copy; {{ year }} StaticHub</span>
    <span>
      <a
        :href="`${baseURL}/photo/${rootId}/${category}`"
        target="_blank"
        rel="noreferrer"
        class="text-primary hover:underline"
      >
        {{ category }}
      </a>
    </span>
  </NLayoutFooter>
</template>
