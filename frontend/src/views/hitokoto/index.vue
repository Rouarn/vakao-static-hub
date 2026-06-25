<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NSpin, NButton, NEmpty, NIcon } from 'naive-ui';
import {
  RefreshOutline,
  Sparkles,
  BookOutline,
  PersonOutline,
} from '@vicons/ionicons5';

defineOptions({ name: 'Hitokoto' });

interface HitokotoResponse {
  hitokoto: string;
  type: string;
  from: string;
  from_who: string | null;
  length: number;
}

const loading = ref(false);
const error = ref<string | null>(null);
const hitokotoData = ref<HitokotoResponse | null>(null);

const typeMap: Record<string, { label: string; color: string }> = {
  a: { label: '动画', color: 'pink' },
  b: { label: '漫画', color: 'purple' },
  c: { label: '游戏', color: 'orange' },
  d: { label: '文学', color: 'blue' },
  e: { label: '原创', color: 'green' },
  f: { label: '网络', color: 'gray' },
  g: { label: '其他', color: 'teal' },
  h: { label: '影视', color: 'fuchsia' },
  i: { label: '诗词', color: 'cyan' },
  j: { label: '网易云', color: 'red' },
  k: { label: '哲学', color: 'amber' },
  l: { label: '抖机灵', color: 'lime' },
};

const typeInfo = computed(() =>
  hitokotoData.value
    ? typeMap[hitokotoData.value.type] || { label: '未知', color: 'gray' }
    : null,
);

async function fetchHitokoto() {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(import.meta.env.VITE_HITOKOTO_API_URL);
    if (!response.ok) throw new Error(`请求失败: ${response.status}`);
    hitokotoData.value = await response.json();
  } catch (e: any) {
    error.value = e.message || '无法获取一言，请稍后再试';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchHitokoto);
</script>

<template>
  <div
    class="h-full bg-gradient-to-br from-gray-50 to-primary/5 dark:from-[#101014] dark:to-primary/10 overflow-y-auto overflow-y-hidden"
  >
    <div class="max-w-4xl mx-auto py-12 px-6">
      <header class="flex items-center justify-between mb-12">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <NIcon size="24" color="white"><Sparkles /></NIcon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-base leading-none">一言</h1>
            <p class="text-sm text-gray-400 mt-1.5 uppercase tracking-widest">
              Hitokoto · Piece of Mind
            </p>
          </div>
        </div>

        <NButton
          strong
          secondary
          round
          @click="fetchHitokoto"
          :loading="loading"
        >
          <template #icon
            ><NIcon><RefreshOutline /></NIcon
          ></template>
          换一句
        </NButton>
      </header>

      <NSpin :show="loading">
        <div
          v-if="error"
          class="bg-base/60 backdrop-blur rounded-3xl p-16 text-center shadow-sm border border-base"
        >
          <NEmpty :description="error" />
          <NButton secondary class="mt-6" @click="fetchHitokoto"
            >重新尝试</NButton
          >
        </div>

        <div v-else-if="hitokotoData" class="space-y-8">
          <div
            class="bg-base rounded-3xl shadow-2xl shadow-primary/10 p-10 md:p-16 relative overflow-hidden group border border-base transition-all duration-500 hover:shadow-primary/20"
          >
            <div
              class="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-30 group-hover:opacity-100 transition-opacity duration-500"
            ></div>
            <div
              class="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"
            ></div>

            <div class="flex justify-between items-start mb-10 relative z-10">
              <span
                class="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300"
                :class="`bg-${typeInfo?.color}-50 text-${typeInfo?.color}-600 dark:bg-${typeInfo?.color}-400/10 dark:text-${typeInfo?.color}-400 ring-1 ring-${typeInfo?.color}-600/10`"
              >
                {{ typeInfo?.label }}
              </span>
              <div class="flex flex-col items-end gap-1">
                <span
                  class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
                  >{{ hitokotoData.length }} CHARS</span
                >
                <div class="w-8 h-0.5 bg-primary/20 rounded-full"></div>
              </div>
            </div>

            <div class="text-center py-8 md:py-14 relative z-10">
              <p
                class="text-2xl md:text-4xl font-semibold text-base leading-tight italic tracking-tight"
              >
                <span
                  class="text-primary opacity-40 text-5xl md:text-7xl font-serif absolute -top-4 -left-4 md:-top-8 md:-left-8"
                  >"</span
                >
                {{ hitokotoData.hitokoto }}
                <span
                  class="text-primary opacity-40 text-5xl md:text-7xl font-serif absolute -bottom-12 -right-4 md:-bottom-20 md:-right-8"
                  >"</span
                >
              </p>
            </div>

            <div
              class="flex flex-wrap justify-center items-center gap-8 mt-12 pt-10 border-t border-base relative z-10"
            >
              <div
                v-if="hitokotoData.from"
                class="flex items-center gap-3 text-sm text-gray-500 hover:text-primary transition-colors cursor-default"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-primary/70"
                >
                  <NIcon size="18"><BookOutline /></NIcon>
                </div>
                <span class="font-medium">《{{ hitokotoData.from }}》</span>
              </div>
              <div
                v-if="hitokotoData.from_who"
                class="flex items-center gap-3 text-sm text-gray-500 hover:text-primary transition-colors cursor-default"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-primary/70"
                >
                  <NIcon size="18"><PersonOutline /></NIcon>
                </div>
                <span class="font-medium">{{ hitokotoData.from_who }}</span>
              </div>
            </div>
          </div>
        </div>
      </NSpin>
    </div>
  </div>
</template>
