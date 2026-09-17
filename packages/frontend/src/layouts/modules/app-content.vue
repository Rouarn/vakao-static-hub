<script setup lang="ts">
import { RouterView } from 'vue-router';
import { KeepAlive } from 'vue';
</script>

<template>
  <div class="w-full h-full">
    <RouterView v-slot="{ Component, route }">
      <KeepAlive :include="['file-list', 'api-docs', 'placeholder']">
        <component :is="Component" :key="route.path" />
      </KeepAlive>
    </RouterView>
  </div>
</template>
