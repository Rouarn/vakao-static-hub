<script setup lang="ts">
import { NIcon, NButton, NInput, NSpace } from 'naive-ui';
import { EyeOutline, LinkOutline } from '@vicons/ionicons5';

interface Props {
  modelValue: string;
  hasPreview: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'preview'): void;
  (e: 'clear'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleInput = (value: string) => {
  emit('update:modelValue', value);
};

const handleConfirm = () => {
  emit('preview');
};

const handleClear = () => {
  emit('clear');
};
</script>

<template>
  <div class="mb-4">
    <h2 class="text-lg font-semibold text-base mb-4">文件预览</h2>
    <NSpace vertical size="large" class="w-full">
      <div class="flex gap-3 items-center">
        <NInput
          :value="modelValue"
          placeholder="输入文件 URL 地址"
          size="large"
          clearable
          @keydown.enter="handleConfirm"
          @update:value="handleInput"
        >
          <template #prefix>
            <NIcon><LinkOutline /></NIcon>
          </template>
        </NInput>
        <NButton
          type="primary"
          size="large"
          :disabled="!modelValue"
          @click="handleConfirm"
        >
          <template #icon>
            <NIcon><EyeOutline /></NIcon>
          </template>
          预览
        </NButton>
        <NButton v-if="hasPreview" size="large" @click="handleClear">
          清除
        </NButton>
      </div>
    </NSpace>
  </div>
</template>
