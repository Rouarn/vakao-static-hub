/**
 * 前端应用入口文件
 * 初始化 Vue 应用，注册全局插件（Pinia, Router）
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import 'uno.css';
import App from './App.vue';
import { setupRouter } from './router';

const app = createApp(App);

// 初始化状态管理
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate); // 启用状态持久化插件

// 注册插件
app.use(pinia);
setupRouter(app); // 使用 setupRouter 来安装路由并设置守卫

// 挂载应用
app.mount('#app');
