<script setup lang="ts">
import { useFileListStore } from '@/stores/modules/file-list';
import { getApiBaseUrl } from '@/utils/env';

const store = useFileListStore();
const baseURL = getApiBaseUrl();
const year = new Date().getFullYear();
</script>

<template>
  <footer
    class="flex items-center justify-between bg-base px-6 py-3 text-xs text-gray-500 border-t border-base flex-shrink-0"
  >
    <span>&copy; {{ year }} StaticHub</span>
    <span>
      <a
        :href="`${baseURL}/photo?rootId=${store.currentRootId}&category=${store.currentCategory}`"
        target="_blank"
        rel="noreferrer"
        class="text-primary hover:underline"
      >
        {{ store.currentCategory }}
      </a>
    </span>
  </footer>
</template>
