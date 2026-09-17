<script setup lang="ts">
/**
 * 应用级危险操作弹窗（修改标识 / 删除应用）
 * 二次确认机制：用户必须手动逐字输入包含应用标识的确认语，按钮才可点击
 */
import { computed, ref, watch } from 'vue';
import { NAlert, NButton, NForm, NFormItem, NInput, NModal } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  mode: 'rename' | 'delete';
  appKey: string;
  /** 删除前展示的当前版本数（不含历史软删记录），null 表示不展示 */
  versionCount?: number | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'confirm', payload: { newAppKey?: string }): void;
}>();

const APP_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

const newAppKey = ref('');
const confirmText = ref('');

watch(
  () => props.show,
  (show) => {
    if (show) {
      newAppKey.value = '';
      confirmText.value = '';
    }
  },
);

const isRename = computed(() => props.mode === 'rename');

const title = computed(() =>
  isRename.value ? '修改应用标识' : `删除应用 ${props.appKey}`,
);

/** 需要逐字输入的确认语（嵌入 appKey，避免脱离上下文机械确认） */
const confirmPhrase = computed(() =>
  isRename.value
    ? `我已确认修改 ${props.appKey}`
    : `我已确认删除 ${props.appKey}`,
);

const newAppKeyError = computed(() => {
  const value = newAppKey.value.trim();
  if (!value) return '请输入新应用标识';
  if (!APP_KEY_PATTERN.test(value)) return '仅允许字母数字与 _ -';
  if (value === props.appKey) return '新标识与当前标识相同';
  return '';
});

const phraseMatched = computed(
  () => confirmText.value.trim() === confirmPhrase.value,
);

const canConfirm = computed(
  () =>
    !props.loading &&
    phraseMatched.value &&
    (!isRename.value || !newAppKeyError.value),
);

function handleConfirm() {
  if (!canConfirm.value) return;
  emit('confirm', {
    newAppKey: isRename.value ? newAppKey.value.trim() : undefined,
  });
}

/**
 * 确认语输入框仅允许键盘逐字输入：
 * - paste 事件同时拦截快捷键粘贴与右键菜单粘贴
 * - drop 事件拦截把文本拖拽放入输入框
 * - autocomplete 关闭，避免浏览器自动填充绕过
 */
const confirmInputProps = {
  autocomplete: 'off',
  onPaste: (e: Event) => e.preventDefault(),
  onDrop: (e: Event) => e.preventDefault(),
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    class="w-[520px]"
    :mask-closable="!loading"
    :close-on-esc="!loading"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <div class="flex flex-col gap-4">
      <NForm v-if="isRename" label-placement="left" label-width="90">
        <NFormItem label="新应用标识">
          <NInput
            v-model:value="newAppKey"
            placeholder="字母数字与 _ -，如 xiaolv"
            :disabled="loading"
            :status="newAppKey && newAppKeyError ? 'error' : undefined"
          />
        </NFormItem>
      </NForm>

      <NAlert
        :type="isRename ? 'warning' : 'error'"
        :show-icon="true"
        title="请仔细阅读以下影响"
      >
        <ul class="list-disc pl-4 flex flex-col gap-1">
          <template v-if="isRename">
            <li>
              应用目录将由
              <span class="font-mono">software-update/{{ appKey }}</span>
              重命名为
              <span class="font-mono"
                >software-update/{{ newAppKey.trim() || '新标识' }}</span
              >
            </li>
            <li>
              全部版本记录（含历史）、升级事件与文件索引将同步迁移到新标识
            </li>
            <li>
              修改立即生效：检查接口中的 appKey
              同步变为新值，仍使用旧标识请求的客户端将检测不到更新
            </li>
          </template>
          <template v-else>
            <li>将永久删除应用 {{ appKey }}，此操作不可恢复</li>
            <li>删除整个应用目录，包括目录内全部 APK 安装包</li>
            <li>
              硬删除全部版本记录<template v-if="versionCount != null">
                （当前 {{ versionCount }} 个，另有历史记录）</template
              >与升级事件
            </li>
            <li>清除文件管理器中的相关索引，删除后检查接口立即失效</li>
          </template>
        </ul>
      </NAlert>

      <div>
        <p class="text-sm mb-1">
          确认操作，请手动输入
          <span class="font-medium text-red-500">{{ confirmPhrase }}</span>
        </p>
        <NInput
          v-model:value="confirmText"
          :placeholder="confirmPhrase"
          :disabled="loading"
          :input-props="confirmInputProps"
          :status="confirmText && !phraseMatched ? 'error' : undefined"
        />
        <p
          v-if="confirmText && !phraseMatched"
          class="text-xs text-red-500 mt-1"
        >
          输入内容与确认语不一致
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton :disabled="loading" @click="emit('update:show', false)">
          取消
        </NButton>
        <NButton
          :type="isRename ? 'warning' : 'error'"
          :disabled="!canConfirm"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ isRename ? '确认修改' : '确认删除' }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
