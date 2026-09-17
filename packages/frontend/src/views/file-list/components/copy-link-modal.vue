<script setup lang="ts">
import { computed } from 'vue';
import { NModal, NButton } from 'naive-ui';
import CopyableCode from '@/components/copyable-code.vue';
import { isImage } from '@/utils/file-types';

const props = defineProps<{
  visible: boolean;
  filePath: string;
  fileUrl: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const linkTypes = computed(() => {
  const isImg = isImage(props.filePath);
  const fileName = props.filePath.split('/').pop() || props.filePath;

  return [
    {
      label: 'URL',
      language: 'text',
      code: props.fileUrl,
    },
    {
      label: 'Markdown',
      language: 'markdown',
      code: `![${fileName}](${props.fileUrl})`,
    },
    {
      label: 'HTML',
      language: 'html',
      code: isImg
        ? `<img src="${props.fileUrl}" alt="${fileName}">`
        : `<a href="${props.fileUrl}">${fileName}</a>`,
    },
  ];
});

function close() {
  emit('close');
}
</script>

<template>
  <n-modal
    :show="props.visible"
    preset="card"
    title="复制链接"
    :mask-closable="true"
    style="max-width: 420px"
    @update:show="
      (value) => {
        if (!value) close();
      }
    "
  >
    <div class="grid grid-cols-3 gap-3 py-2">
      <CopyableCode
        v-for="link in linkTypes"
        :key="link.label"
        :code="link.code"
        :language="link.language"
        :label="link.label"
        mode="button"
      />
    </div>

    <template #footer>
      <div class="flex justify-center">
        <n-button @click="close">关闭</n-button>
      </div>
    </template>
  </n-modal>
</template>
