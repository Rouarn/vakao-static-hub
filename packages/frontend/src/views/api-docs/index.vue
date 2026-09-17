<script setup lang="ts">
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
