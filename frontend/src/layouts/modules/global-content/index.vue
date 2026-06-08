<script setup lang="ts">
/**
 * 全局内容区域组件
 * 使用 RouterView 显示路由内容
 * 包含 KeepAlive 实现路由保活
 */
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
