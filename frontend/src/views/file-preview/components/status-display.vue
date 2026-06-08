<script setup lang="ts">
import { NIcon, NAlert, NButton } from 'naive-ui';
import { DocumentTextOutline } from '@vicons/ionicons5';

interface Props {
  type: 'empty' | 'unsupported' | 'error';
  fileUrl?: string;
  errorMessage?: string;
}

interface Emits {
  (e: 'reload'): void;
}

const props = withDefaults(defineProps<Props>(), {
  fileUrl: '',
  errorMessage: '',
});
const emit = defineEmits<Emits>();
</script>

<template>
  <div class="h-full">
    <!-- 空状态 -->
    <template v-if="type === 'empty'">
      <div
        class="h-full flex flex-col items-center justify-center text-gray-400"
      >
        <NIcon size="64" class="mb-4">
          <DocumentTextOutline />
        </NIcon>
        <p>输入文件 URL 地址开始预览</p>
      </div>
    </template>

    <!-- 不支持的文件类型 -->
    <template v-else-if="type === 'unsupported'">
      <div
        class="h-full flex flex-col items-center justify-center text-gray-400"
      >
        <NIcon size="64" class="mb-4">
          <DocumentTextOutline />
        </NIcon>
        <p class="mb-4">暂不支持此文件类型的预览</p>
        <NButton type="primary" tag="a" :href="fileUrl" target="_blank">
          点击下载查看
        </NButton>
      </div>
    </template>

    <!-- 错误状态 -->
    <template v-else-if="type === 'error'">
      <div class="absolute inset-0 bg-white/90 dark:bg-black/90 z-20">
        <NAlert type="error" :description="errorMessage" closable class="m-4">
          文档加载失败
        </NAlert>
        <div class="flex flex-col items-center justify-center h-1/2">
          <NIcon size="48" class="text-red-400 mb-4">
            <DocumentTextOutline />
          </NIcon>
          <p class="text-gray-500 mb-4">无法加载文档</p>
          <NButton type="primary" @click="$emit('reload')"> 重新加载 </NButton>
        </div>
      </div>
    </template>
  </div>
</template>
