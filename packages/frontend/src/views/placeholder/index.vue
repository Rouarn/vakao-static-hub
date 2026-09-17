<script setup lang="ts">
defineOptions({
  name: 'placeholder',
});

import { ref, computed } from 'vue';
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker,
  NButton,
  NSelect,
  NSpace,
  NDivider,
} from 'naive-ui';
import { getApiBaseUrl } from '@/utils/env';
import CopyableCode from '@/components/copyable-code.vue';

const baseURL = getApiBaseUrl();

const width = ref<number | undefined>(300);
const height = ref<number | undefined>(150);
const text = ref<string>('');
const bgColor = ref<string>('#cccccc');
const textColor = ref<string>('#969696');
const fontFamily = ref<string>('');
const fontWeight = ref<string>('bold');
const fontSize = ref<number | undefined>(undefined);

const linkTypes = computed(() => [
  { label: 'URL', language: 'text', code: placeholderUrl.value },
  { label: 'Markdown', language: 'markdown', code: markdownUrl.value },
  { label: 'HTML', language: 'html', code: htmlUrl.value },
]);

const fontWeightOptions = [
  { label: '正常', value: 'normal' },
  { label: '粗体', value: 'bold' },
  { label: '100', value: '100' },
  { label: '200', value: '200' },
  { label: '300', value: '300' },
  { label: '400', value: '400' },
  { label: '500', value: '500' },
  { label: '600', value: '600' },
  { label: '700', value: '700' },
  { label: '800', value: '800' },
  { label: '900', value: '900' },
];

const placeholderUrl = computed(() => {
  const params = new URLSearchParams();
  if (width.value !== undefined) params.set('width', String(width.value));
  if (height.value !== undefined) params.set('height', String(height.value));
  if (text.value) params.set('text', text.value);
  if (bgColor.value) params.set('bgColor', bgColor.value.replace('#', ''));
  if (textColor.value)
    params.set('textColor', textColor.value.replace('#', ''));
  if (fontFamily.value) params.set('fontFamily', fontFamily.value);
  if (fontWeight.value) params.set('fontWeight', fontWeight.value);
  if (fontSize.value !== undefined)
    params.set('fontSize', String(fontSize.value));

  const queryString = params.toString();
  return `${baseURL}/placeholder${queryString ? `?${queryString}` : ''}`;
});

const markdownUrl = computed(() => `![Placeholder](${placeholderUrl.value})`);

const htmlUrl = computed(
  () => `<img src="${placeholderUrl.value}" alt="Placeholder">`,
);

function reset() {
  width.value = 300;
  height.value = 150;
  text.value = '';
  bgColor.value = '#cccccc';
  textColor.value = '#969696';
  fontFamily.value = '';
  fontWeight.value = 'bold';
  fontSize.value = undefined;
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-base">占位图生成器</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NCard
        title="配置"
        :bordered="false"
        class="bg-base border border-base shadow-sm"
      >
        <NForm :label-width="100" label-placement="left">
          <NFormItem label="宽度">
            <NInputNumber v-model:value="width" placeholder="300" :min="1" />
          </NFormItem>
          <NFormItem label="高度">
            <NInputNumber v-model:value="height" placeholder="150" :min="1" />
          </NFormItem>
          <NFormItem label="文字">
            <NInput v-model:value="text" placeholder="例如: 300x150" />
          </NFormItem>
          <NFormItem label="背景色">
            <NColorPicker v-model:value="bgColor" show-alpha />
          </NFormItem>
          <NFormItem label="文字颜色">
            <NColorPicker v-model:value="textColor" show-alpha />
          </NFormItem>
          <NFormItem label="字体">
            <NInput
              v-model:value="fontFamily"
              placeholder="例如: Arial, sans-serif"
            />
          </NFormItem>
          <NFormItem label="字重">
            <NSelect v-model:value="fontWeight" :options="fontWeightOptions" />
          </NFormItem>
          <NFormItem label="字体大小">
            <NInputNumber
              v-model:value="fontSize"
              :min="1"
              placeholder="自动"
            />
          </NFormItem>
        </NForm>

        <NDivider />

        <NSpace>
          <NButton type="primary" @click="reset">重置</NButton>
        </NSpace>
      </NCard>

      <div class="sticky top-6 h-fit">
        <NCard
          title="预览"
          :bordered="false"
          class="bg-base border border-base shadow-sm"
        >
          <div
            class="flex justify-center items-center min-h-[200px] bg-container rounded-lg p-4 mb-4"
          >
            <img
              :src="placeholderUrl"
              alt="Placeholder Preview"
              class="max-w-full"
            />
          </div>

          <NForm label-placement="top">
            <NFormItem
              v-for="link in linkTypes"
              :key="link.label"
              :label="link.label"
            >
              <CopyableCode
                :code="link.code"
                :language="link.language"
                :label="link.label"
              />
            </NFormItem>
          </NForm>
        </NCard>
      </div>
    </div>
  </div>
</template>
