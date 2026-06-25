import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          'vue-router': ['RouterLink', 'RouterView'],
        },
      ],
      dts: 'src/typings/auto-imports.d.ts',
    }),
    Components({
      dts: 'src/typings/components.d.ts',
      types: [{ from: 'vue-router', names: ['RouterLink', 'RouterView'] }],
      resolvers: [NaiveUiResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 9867,
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jit-viewer')) {
              return 'jit-viewer';
            }
            if (id.includes('naive-ui')) {
              return 'naive-ui';
            }
            if (
              id.includes('vue') ||
              id.includes('vue-router') ||
              id.includes('pinia')
            ) {
              return 'vue-vendor';
            }
            if (id.includes('axios') || id.includes('dayjs')) {
              return 'utils-vendor';
            }
            if (id.includes('@iconify') || id.includes('@vicons')) {
              return 'icons-vendor';
            }
            return 'vendor';
          }
        },
      },
      onwarn(warning, warn) {
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          warning.message.includes('@vueuse/core')
        ) {
          return;
        }
        if (warning.code === 'EVAL' && warning.message.includes('jit-viewer')) {
          return;
        }
        if (warning.message?.includes('jit-viewer')) {
          return;
        }
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 12000, // Increase limit for jit-viewer large chunk
  },
});
