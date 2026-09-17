<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { NImage, NIcon } from 'naive-ui';
import { DocumentOutline } from '@vicons/ionicons5';

interface Props {
  filePath: string;
  fileUrl: (path: string) => string;
}

const props = defineProps<Props>();

const thumbnailContainer = ref<HTMLElement | null>(null);
const containerWidth = ref(80);
const containerHeight = ref(80);
const imageLoadError = ref(false);

const getImageQuality = () => {
  const dpr = window.devicePixelRatio || 1;
  if (dpr >= 3) {
    return 80;
  } else if (dpr >= 2) {
    return 70;
  } else {
    return 60;
  }
};

const thumbnailUrl = computed(() => {
  const url = props.fileUrl(props.filePath);
  const separator = url.includes('?') ? '&' : '?';
  const quality = getImageQuality();
  return `${url}${separator}w=${containerWidth.value}&h=${containerHeight.value}&q=${quality}&format=webp`;
});

const handleImageError = () => {
  imageLoadError.value = true;
};

onMounted(async () => {
  await nextTick();
  if (thumbnailContainer.value) {
    const rect = thumbnailContainer.value.getBoundingClientRect();
    containerWidth.value = Math.round(rect.width);
    containerHeight.value = Math.round(rect.height);
  }
});
</script>

<template>
  <div
    ref="thumbnailContainer"
    class="h-full w-full bg-container flex items-center justify-center relative overflow-hidden"
  >
    <NImage
      v-if="!imageLoadError"
      :src="thumbnailUrl"
      :alt="filePath"
      :preview-src="fileUrl(filePath)"
      lazy
      object-fit="cover"
      width="100%"
      height="100%"
      @error="handleImageError"
    >
      <template #placeholder>
        <NIcon size="32" class="text-gray-400">
          <DocumentOutline />
        </NIcon>
      </template>
    </NImage>
    <NIcon v-else size="32" class="text-gray-400">
      <DocumentOutline />
    </NIcon>
  </div>
</template>
