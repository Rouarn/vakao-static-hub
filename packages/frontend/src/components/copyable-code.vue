<script setup lang="ts">
import { ref, computed } from 'vue';
import { NCode, NButton, NIcon, NText } from 'naive-ui';
import {
  CopyOutline,
  CheckmarkOutline,
  LinkOutline,
  CodeSlashOutline,
  LogoMarkdown,
} from '@vicons/ionicons5';

const props = withDefaults(
  defineProps<{
    code: string;
    language: string;
    label: string;
    mode?: 'default' | 'button';
    showLabel?: boolean;
  }>(),
  {
    mode: 'default',
    showLabel: false,
  },
);

const copied = ref(false);

const icon = computed(() => {
  if (props.label.toLowerCase().includes('url')) return LinkOutline;
  if (props.label.toLowerCase().includes('markdown')) return LogoMarkdown;
  if (props.label.toLowerCase().includes('html')) return CodeSlashOutline;
  return CopyOutline;
});

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
  }
}
</script>

<template>
  <div v-if="mode === 'button'" class="flex flex-col items-center gap-2">
    <button
      type="button"
      class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-base bg-base hover:border-primary hover:bg-primary/5 transition-all active:scale-95 w-full"
      @click="copyToClipboard(code)"
    >
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
        :class="
          copied
            ? 'bg-green-500 text-white'
            : 'bg-primary/10 text-primary dark:bg-primary/20'
        "
      >
        <NIcon :size="26">
          <CheckmarkOutline v-if="copied" />
          <component :is="icon" v-else />
        </NIcon>
      </div>
      <NText class="font-medium">{{ label }}</NText>
      <NText v-if="copied" class="text-xs text-green-500 font-medium">
        已复制!
      </NText>
    </button>
  </div>

  <div v-else class="flex items-center gap-2">
    <NCode :code="code" :language="language" word-wrap class="flex-1" />
    <NButton text size="small" type="default" @click="copyToClipboard(code)">
      <template #icon>
        <NIcon :size="18" :class="copied ? 'text-green-500' : ''">
          <CheckmarkOutline v-if="copied" />
          <CopyOutline v-else />
        </NIcon>
      </template>
    </NButton>
  </div>
</template>
