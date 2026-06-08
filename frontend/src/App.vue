<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { NMessageProvider, NConfigProvider, darkTheme } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import { useDark } from '@vueuse/core';

const isDark = useDark();

const theme = computed(() => (isDark.value ? darkTheme : null));

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    primaryColorSuppl: '#36ad6a',
  },
};
</script>

<template>
  <NConfigProvider :theme="theme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <div class="w-full h-full">
        <RouterView />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
