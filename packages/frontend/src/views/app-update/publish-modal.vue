<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  NModal,
  NRadioGroup,
  NRadioButton,
  NSelect,
  NAlert,
  NButton,
  useMessage,
} from 'naive-ui';
import { publishVersion } from '@/api/app-update';
import type { AppVersion } from '@vakao/shared';
import type { AxiosError } from 'axios';

const props = defineProps<{ show: boolean; version: AppVersion | null }>();
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'saved'): void;
}>();

const message = useMessage();
const submitting = ref(false);
const mode = ref<'full' | 'gray'>('full');
const grayPercent = ref<number | null>(5);

watch(
  () => props.show,
  (show) => {
    if (show) {
      mode.value = 'full';
      grayPercent.value = 5;
    }
  },
);

const percentOptions = Array.from({ length: 99 }, (_, i) => ({
  label: `${i + 1}%`,
  value: i + 1,
}));

const grayError = computed(() =>
  mode.value === 'gray' && !grayPercent.value ? '请选择灰度百分比' : '',
);

async function handleConfirm() {
  if (grayError.value) return;
  if (!props.version) return;
  submitting.value = true;
  try {
    await publishVersion(props.version.id, {
      mode: mode.value,
      grayPercent: mode.value === 'gray' ? grayPercent.value! : undefined,
    });
    message.success(
      mode.value === 'full' ? '已全量发布' : `已灰度发布 ${grayPercent.value}%`,
    );
    emit('saved');
    emit('update:show', false);
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    message.error(axiosErr.response?.data?.message || '发布失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    :title="`发布版本 v${props.version?.versionName ?? ''} (${props.version?.versionCode ?? ''})`"
    class="w-[440px]"
    :mask-closable="!submitting"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <div class="flex flex-col gap-4">
      <NRadioGroup v-model:value="mode" :disabled="submitting">
        <NRadioButton value="full">全量发布</NRadioButton>
        <NRadioButton value="gray">灰度发布</NRadioButton>
      </NRadioGroup>

      <NSelect
        v-if="mode === 'gray'"
        v-model:value="grayPercent"
        :options="percentOptions"
        placeholder="灰度百分比（命中的设备可见更新）"
        :status="grayError ? 'error' : undefined"
        :disabled="submitting"
      />

      <NAlert type="info" :show-icon="false">
        <template v-if="mode === 'gray'">
          仅 deviceId
          稳定哈希命中的设备可检测到此版本，其余设备回落到最近全量版本。
        </template>
        <template v-else>
          发布门禁：versionCode 必须大于当前全量最大版本，否则将被拒绝。
        </template>
      </NAlert>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton :disabled="submitting" @click="emit('update:show', false)">
          取消
        </NButton>
        <NButton type="primary" :loading="submitting" @click="handleConfirm">
          确认发布
        </NButton>
      </div>
    </template>
  </NModal>
</template>
