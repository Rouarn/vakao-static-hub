<script setup lang="ts">
/**
 * API 文档组件
 * 通过 iframe 嵌入 API 文档页面
 */
import { getBaseUrl } from '@/utils/env';

defineOptions({ name: 'ApiDocs' });

const baseURL = getBaseUrl();
</script>

<template>
  <div class="h-full w-full bg-base">
    <iframe
      :src="`${baseURL}/docs`"
      class="w-full h-99% border-none"
      title="API Documentation"
    ></iframe>
  </div>
</template>
