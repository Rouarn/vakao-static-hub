# Vakao Static Hub — 前端

<p align="center">
  <img src="./public/intro.svg" width="300" height="155" alt="Vakao Static Hub Logo" />
</p>

基于 **Vue 3** + **Vite** + **NaiveUI** 的静态资源管理系统前端，提供文件管理、随机图片浏览、占位图生成和一言服务等功能。

> 后端文档：参见 [../README.md](../README.md)

---

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3.5 + Composition API | `<script setup>` 语法 |
| 构建 | Vite 8 | 极速 HMR |
| UI 组件 | NaiveUI 2 | 组件自动按需导入 |
| 状态管理 | Pinia 3 + persistedstate | 状态持久化到 localStorage |
| 路由 | Vue Router 5 | 路由守卫 + 权限控制 |
| HTTP | Axios | 拦截器自动附加 Token |
| CSS | UnoCSS | 原子化 CSS |
| 图标 | @vicons/ionicons5 | IonIcons 图标集 |
| 工具 | @vueuse/core, dayjs | 组合式工具 + 日期处理 |
| 预览 | jit-viewer | 多格式文件在线预览 |
| 类型 | TypeScript 6 | 全类型覆盖 |

---

## 快速开始

```bash
# 在项目根目录（monorepo）
pnpm install

# 启动开发服务器（端口 9867，HMR）
pnpm run start:frontend

# 或在 frontend 目录下
cd frontend
pnpm dev
```

开发服务器默认运行在 `http://localhost:9867`，API 请求通过环境变量 `VITE_API_BASE_URL` 转发到后端。

---

## 目录结构

```
frontend/
├── index.html                     # HTML 入口
├── vite.config.ts                 # Vite 配置（别名、分包、代理）
├── uno.config.ts                  # UnoCSS 预设
├── tsconfig.json                  # TS 配置
├── package.json
├── public/
│   └── intro.svg                  # Logo
└── src/
    ├── main.ts                    # 应用入口：创建 Vue 实例，注册 Pinia/Router
    ├── App.vue                    # 根组件：NaiveUI ConfigProvider + 暗色模式
    ├── contexts/
    │   └── app.ts                 # 依赖注入：appContextKey（状态接口定义）
    ├── router/
    │   ├── index.ts               # 路由实例创建
    │   ├── routes/
    │   │   ├── index.ts           # 路由表组装（主布局 + 子路由）
    │   │   └── builtin.ts         # 独立路由（登录、文件预览、404）
    │   └── guard/
    │       └── index.ts           # 路由守卫：认证检查、登录重定向
    ├── layouts/
    │   ├── base-layout/
    │   │   └── index.vue          # 主布局：Header + Sidebar + Content + Footer
    │   └── modules/
    │       ├── global-header/
    │       │   └── index.vue      # 顶部栏：Logo、刷新、上传、暗色切换、登出
    │       ├── global-menu/
    │       │   └── index.vue      # 侧边栏：分类列表 + 系统功能导航 + 根目录切换
    │       ├── global-content/
    │       │   └── index.vue      # 内容区：RouterView 插槽
    │       └── global-footer/
    │           └── index.vue      # 底部栏
    ├── views/
    │   ├── login/
    │   │   └── index.vue          # 登录页：表单验证、JWT 签发、自动跳转
    │   ├── file-list/
    │   │   ├── index.vue          # 文件列表页：网格/列表视图、虚拟滚动、分页
    │   │   ├── file-card.vue      # 文件卡片：缩略图、文件名、大小、操作
    │   │   └── components/        # 列表视图子组件
    │   ├── file-preview/
    │   │   ├── index.vue          # 文件预览页：URL 输入、多格式渲染
    │   │   ├── composables/
    │   │   │   └── use-file-preview.ts  # 预览状态管理
    │   │   └── components/
    │   │       ├── url-input.vue       # URL 输入组件
    │   │       ├── file-viewer.vue     # 文件渲染器（jit-viewer）
    │   │       └── status-display.vue  # 状态提示（空/错误/不支持）
    │   ├── placeholder/
    │   │   └── index.vue          # 占位图生成器：可视化配置 + 实时预览
    │   ├── hitokoto/
    │   │   └── index.vue          # 一言：随机短句展示
    │   └── api-docs/
    │       └── index.vue          # API 文档：iframe 嵌入 Swagger UI
    ├── components/
    │   ├── upload-modal.vue       # 上传弹窗：拖拽、文件夹上传、进度条
    │   ├── root-management.vue    # 根目录管理：增删改、服务器目录浏览
    │   └── copyable-code.vue      # 可复制代码块
    ├── service/
    │   ├── request/
    │   │   └── http.ts            # Axios 实例：baseURL、Token 注入、401 拦截
    │   └── api/
    │       ├── auth.ts            # 认证 API：login()
    │       └── files.ts           # 文件 API：CRUD、上传、根目录管理
    ├── stores/
    │   └── modules/
    │       └── auth/
    │           └── index.ts       # 认证 Store：accessToken、isLoggedIn、持久化
    └── utils/
        ├── env.ts                 # 环境变量工具：getApiBaseUrl()、getBaseUrl()
        └── file-types.ts          # 文件类型映射：扩展名、预览支持判断
```

---

## 路由表

| 路径 | 页面 | 需要认证 | 说明 |
|------|------|----------|------|
| `/login` | 登录页 | 否 | 用户名/密码登录，支持 redirect 参数回跳 |
| `/` | 重定向 | - | 自动跳转到 `/file-list` |
| `/file-list` | 文件列表 | 是 | 主页面，文件浏览/上传/删除/搜索/排序 |
| `/file-preview` | 文件预览 | 否 | 独立页面，输入 URL 预览文件 |
| `/local-file-preview` | 本地文件预览 | 是 | 布局内嵌的文件预览 |
| `/api-docs` | API 文档 | 是 | iframe 嵌入 `/docs` Swagger UI |
| `/placeholder-generator` | 占位图生成器 | 是 | 可视化占位图配置工具 |
| `/hitokoto` | 一言 | 是 | 随机励志短句展示 |
| `/:pathMatch(.*)*` | 404 兜底 | - | 重定向到 `/file-list` |

---

## 认证机制

### 流程图

```
用户访问 → router.beforeEach
               │
    ┌──────────┴──────────┐
    │ 目标页是 /login？     │
    ├── 是 → 已登录? ──是→ 跳转 /file-list
    │        └─ 否 → 正常进入
    │
    ├── requiresAuth !== false？
    │   ├── 是 → 未登录？──是→ 跳转 /login?redirect=原路径
    │   │           └─ 否 → 正常进入
    │   └── 否 → 正常进入（公开页面）
    └─────────────────────
```

### 状态持久化

- 使用 Pinia + `pinia-plugin-persistedstate` 将 `accessToken` 持久化到 `localStorage`
- 页面刷新后自动恢复认证状态
- 登出时清除 Token（通过 `authStore.clearAuth()`）

### HTTP 拦截器

- **请求拦截器**：自动为已登录请求附加 `Authorization: Bearer {token}`
- **响应拦截器**：捕获 `401` 状态码，自动清除 Token 并跳转登录页

---

## 核心功能

### 1. 文件列表（主页面）

- **双视图模式**：网格视图（卡片缩略图 + 虚拟滚动）和列表视图（NaiveUI DataTable）
- **分页浏览**：默认每页 100 条，支持页码跳转
- **搜索过滤**：关键词搜索匹配文件名和路径
- **排序**：支持按名称、大小、修改时间排序，升序/降序切换
- **文件操作**：
  - 下载：点击直接下载
  - 删除：弹窗确认后删除
  - 预览：可预览格式（图片、PDF 等）内嵌打开
- **根目录切换**：顶部下拉切换不同资源根目录
- **分类导航**：侧边栏显示当前根目录下的所有分类（一级子目录）
- **响应式**：适配移动端，小于 `md` 断点时侧边栏折叠

### 2. 文件上传

- **拖拽上传**：支持文件/文件夹拖放到上传区域
- **文件夹处理**：
  - 单个文件夹：自动设置为分类路径，保留内部结构
  - 多个文件/文件夹：递归读取并保留目录结构
- **进度显示**：每个文件独立进度条
- **分类输入**：支持自动补全已有分类名称

### 3. 根目录管理

- **增删改**：添加/删除/更新资源根目录
- **服务器目录浏览**：通过接口浏览服务器文件系统，提供面包屑导航
- **路径选择**：支持 Unix 和 Windows 双平台目录结构

### 4. 占位图生成器

- **实时预览**：修改参数即时刷新预览图
- **可配置项**：
  - 宽度 / 高度（数字输入）
  - 显示文字
  - 背景颜色 / 文字颜色（取色器）
  - 字体、字重（下拉选择）、字体大小
- **多格式导出**：自动生成 URL、Markdown `![]()`、HTML `<img>` 代码片段
- **一键复制**：`CopyableCode` 组件提供复制按钮

### 5. 一言

- 调用一言 API 获取随机励志短句
- 显示句子内容、分类标签、出处、作者
- 支持换一句刷新
- 精美卡片式 UI 设计（渐变背景、装饰元素）

### 6. 文件预览

- **独立页面**：`/file-preview`（无需认证）和 `/local-file-preview`（需认证）
- **URL 输入**：粘贴文件 URL 即可预览
- **多格式支持**：基于 `jit-viewer`，支持 40+ 种文件格式
  - 文档类：PDF、Word、Excel、PPT、Markdown、TXT
  - 图片类：全部主流格式
  - 代码类：JS/TS/CSS/JSON/YAML 等高亮渲染
  - 媒体类：视频/音频
- **暗色模式**：自动跟随系统/页面主题
- **状态展示**：空状态、错误提示、不支持的格式提示

### 7. API 文档

- 通过 `<iframe>` 嵌入后端 Swagger UI（`/docs`）
- 全屏展示，左侧导航栏可折叠

---

## 暗色模式

使用 `@vueuse/core` 的 `useDark()` 和 `useToggle()`，切换存储在 `localStorage`，全局共享状态：

- `App.vue`：NaiveUI `NConfigProvider` 根据 `isDark` 切换 `darkTheme`
- `global-header`：提供月亮/太阳图标切换按钮
- 所有页面自动适配

主题色：`#18a058`（NaiveUI 绿色主题）

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE_URL` | - | 后端 API 地址（开发时通常是 `http://localhost:9865`，生产部署为 `"origin"` 即同源） |
| `VITE_HITOKOTO_API_URL` | - | 一言 API 地址 |

前端通过 `src/utils/env.ts` 解析：
- `getApiBaseUrl()`：返回 `${VITE_API_BASE_URL}/api`
- `getBaseUrl()`：返回 `VITE_API_BASE_URL`（`"origin"` 时替换为 `window.location.origin`）

---

## 构建与部署

### 开发

```bash
cd frontend
pnpm dev          # 启动 Vite 开发服务器 (端口 9867)
pnpm typecheck    # TypeScript 类型检查
```

### 生产构建

```bash
cd frontend
pnpm build        # vue-tsc 类型检查 + vite build
pnpm preview      # 预览构建产物
```

Vite 构建配置：

- **代码分包**：
  - `vue-vendor`：Vue、Vue Router、Pinia
  - `naive-ui`：NaiveUI 组件库
  - `jit-viewer`：文件预览组件
  - `utils-vendor`：Axios、dayjs
  - `icons-vendor`：图标库
  - `vendor`：其他依赖
- **输出目录**：`frontend/dist/`
- **资源命名**：`assets/js/[name]-[hash].js`、`assets/[ext]/[name]-[hash].[ext]`

### 一体化部署

参见根目录 [../README.md](../README.md) 部署章节。执行 `pnpm deploy`（在根目录）会自动：

1. 以 `VITE_API_BASE_URL=origin` 构建前端
2. 将 `dist/` 移动到 `deploy/web/`
3. 后端 NestJS 启动时自动挂载为静态资源并提供 SPA fallback

生产模式下前端无需独立服务器，与后端同源部署。

---

## 开发约定

- **组件注册**：使用 `unplugin-vue-components` 自动按需导入 NaiveUI 组件，无需手动 `import`
- **路由组件**：使用 `() => import()` 实现懒加载，按页面拆分 chunk
- **TypeScript**：全量类型覆盖，`vue-tsc` 构建前类型检查
- **CSS**：UnoCSS 原子化类名 + NaiveUI 主题变量，不写独立样式文件
- **状态管理**：`provide/inject`（`appContextKey`）用于跨组件共享文件列表状态
