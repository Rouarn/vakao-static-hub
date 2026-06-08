# Vakao Static Hub

<p align="center">
  <img src="./frontend/public/intro.svg" width="300" height="155" alt="Vakao Static Hub Logo" />
</p>

一个基于 **NestJS** + **Vue 3** 的静态资源管理系统，提供多根目录文件管理、随机图片服务、占位图生成和一言代理功能。

> 前端文档：参见 [frontend/README.md](./frontend/README.md)

---

## 核心特性

- **多根目录管理**：动态增删资源根目录，配置持久化，支持服务器目录浏览
- **文件管理**：上传、删除、分页浏览、关键词搜索、多字段排序（名称 / 大小 / 修改时间）
- **文件索引**：SQLite (better-sqlite3) + TypeORM，启动时全量扫描，定时 5 分钟自动同步
- **图片处理**：基于 Sharp，支持缩放、格式转换（webp/jpeg/png）、质量调节，磁盘缓存 `.cache/thumbnails`
- **随机图片服务**：多维度路由（全局 / 指定根目录 / 指定分类 / 指定尺寸），直接扫描文件系统，内置洗牌缓存
- **占位图生成**：SVG 占位图动态生成，支持尺寸、颜色、文字、字体、字重自定义
- **一言代理**：反向代理 `hitokoto` 服务，支持 GET/POST，转发请求日志
- **统一鉴权**：JWT（Bearer Token），`@Public()` 装饰器开放白名单接口
- **API 文档**：Swagger UI `/api/docs`
- **统一响应格式**：全局拦截器包装 `{ code, message, data }`
- **SPA 支持**：生产模式下自动挂载前端静态资源并提供 fallback

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js >= 18 |
| 框架 | NestJS 11 |
| 语言 | TypeScript 5.x |
| 数据库 | SQLite (better-sqlite3 + TypeORM) |
| 认证 | @nestjs/jwt + passport-jwt |
| 图片处理 | Sharp |
| 定时任务 | @nestjs/schedule |
| 事件 | @nestjs/event-emitter |
| API 文档 | @nestjs/swagger |
| 前端 | Vue 3 + Vite + NaiveUI（见 [frontend/README.md](./frontend/README.md)） |
| 包管理 | pnpm (workspace monorepo) |

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 允许 better-sqlite3 编译（首次安装后执行一次）
pnpm approve-builds

# 3. 启动后端（开发模式，热重载）
pnpm run start:dev

# 4. 另开终端，启动前端（开发模式，热重载）
pnpm run start:frontend

# 或同时启动前后端
pnpm run dev
```

默认端口：

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | http://localhost:9865 | 所有接口前缀 `/api` |
| 前端 | http://localhost:9867 | 开发服务器 |
| API 文档 | http://localhost:9865/docs | Swagger UI |
| 健康检查 | http://localhost:9865/api/health | 返回 `{ status: "ok" }` |

---

## 环境变量

配置位于 `src/config/` 下各模块的配置文件中，均从环境变量读取，提供默认值。

### 服务器

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `9865` | 后端监听端口 |
| `BODY_LIMIT` | `10485760` (10MB) | 请求体大小限制（字节） |
| `STATIC_PREFIX` | `/static` | 静态文件 URL 前缀 |

### 认证

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AUTH_USER` | `admin` | 登录用户名 |
| `AUTH_PASS` | `admin` | 登录密码 |
| `JWT_SECRET` | `change-me-in-env` | JWT 签名密钥（生产环境务必修改） |
| `JWT_EXPIRES_IN` | `12h` | Token 过期时间 |

### 数据库

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_PATH` | `resources/vakao.db` | SQLite 文件路径 |
| `DB_SYNCHRONIZE` | `true` | 是否自动建表 |

### 文件

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `FILE_ROOT` | `resources/` | 文件存储根目录 |
| `UPLOAD_MAX_COUNT` | `20` | 单次上传最大文件数 |
| `DEFAULT_CATEGORY` | `TemporaryFile` | 默认分类目录名 |

### 定时任务

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CACHE_REFRESH_INTERVAL_MS` | `300000` (5min) | 缓存刷新间隔（毫秒） |

### 一言代理

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HITOKOTO_API_URL` | `''` | 一言 API 目标地址 |

---

## 目录结构（后端）

```
src/
├── main.ts                       # 应用入口：启动 NestJS，注册中间件/拦截器/过滤器/Swagger
├── app.module.ts                 # 根模块：导入所有子模块
├── app.controller.ts             # 根控制器：健康检查 /api/health
├── app.service.ts                # 根服务（预留扩展）
├── common/
│   ├── response.interceptor.ts   # 全局响应拦截器 → { code, message, data }
│   └── http-exception.filter.ts  # 全局异常过滤器 → 统一错误响应
├── config/
│   ├── app-config.module.ts      # ConfigModule 装配
│   ├── auth.config.ts            # 认证配置（用户名/密码/JWT）
│   ├── db.config.ts              # SQLite 路径 + 同步开关
│   ├── file.config.ts            # 文件根目录/上传限制/图片扩展名
│   ├── schedule.config.ts        # 缓存刷新间隔
│   └── server.config.ts          # 端口/请求限制/静态资源目录
├── infra/
│   ├── database/
│   │   ├── database.module.ts    # TypeORM SQLite 连接
│   │   └── entities/
│   │       └── file-entry.entity.ts  # 文件索引实体
│   └── resource-roots/
│       ├── resource-roots.module.ts
│       └── resource-roots.service.ts # 多根目录 CRUD + resources.json 持久化 + 事件广播
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts    # POST /api/auth/login
│   │   ├── auth.service.ts       # 凭证验证 + JWT 签发
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts       # Passport JWT 策略
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts # 全局守卫 + @Public() 白名单
│   │   ├── decorators/
│   │   │   └── public.decorator.ts
│   │   └── dto/
│   │       └── login.dto.ts
│   ├── files/
│   │   ├── files.controller.ts   # GET/POST/DELETE /api/files/:rootId/:category/*path
│   │   ├── files.service.ts      # 文件 CRUD + 目录浏览 + 安全路径拼接
│   │   ├── file-index.service.ts # 全量/增量索引同步（定时 + 事件驱动）
│   │   ├── image-processor.service.ts # Sharp 图片缩放/格式转换 + 磁盘缓存
│   │   ├── roots.controller.ts   # GET/POST/PATCH/DELETE /api/roots
│   │   ├── files.module.ts
│   │   ├── dto/
│   │   │   ├── list-files-query.dto.ts
│   │   │   └── create-resource-root.dto.ts
│   │   └── utils/
│   │       ├── mime-types.ts
│   │       └── path-utils.ts
│   ├── photo/
│   │   ├── photo.controller.ts   # GET /api/photo/:rootId?/:category?/:width?/:height?
│   │   ├── photo.service.ts      # 多维度图片缓存 + Fisher-Yates 洗牌 + 随机选取
│   │   └── photo.module.ts
│   ├── placeholder/
│   │   ├── placeholder.controller.ts  # GET /api/placeholder/:width?/:height?
│   │   ├── placeholder.service.ts     # SVG 占位图生成
│   │   ├── placeholder.module.ts
│   │   └── generators/
│   │       └── default.ts
│   └── hitokoto/
│       ├── hitokoto.controller.ts        # ALL /api/hitokoto/*path（代理转发）
│       ├── hitokoto.proxy.middleware.ts  # http-proxy-middleware 实现
│       └── hitokoto.module.ts
└── utils/
    └── size.util.ts
```

---

## API 概览

所有接口前缀 `/api`，统一响应格式：

```json
{
  "code": 200,
  "message": "成功",
  "data": { ... }
}
```

### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 登录，返回 JWT | 否 |

### 资源根目录

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/roots` | 获取所有根目录 | 是 |
| POST | `/roots` | 添加根目录 | 是 |
| PATCH | `/roots/:id` | 更新根目录 | 是 |
| DELETE | `/roots/:id` | 删除根目录 | 是 |
| GET | `/roots/system/directories?path=` | 浏览服务器目录 | 是 |

### 文件管理

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/files/:rootId/categories` | 获取分类列表 | 是 |
| GET | `/files/:rootId/:category` | 分页查询文件列表 | 是 |
| POST | `/files/:rootId/upload` | 上传文件 (multipart) | 是 |
| GET | `/files/:rootId/:category/*path` | 下载/预览文件 | 否（公开） |
| DELETE | `/files/:rootId/:category/*path` | 删除文件 | 是 |

**分页查询参数**：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `page` | `1` | 页码 |
| `pageSize` | `100` | 每页数量 |
| `q` | - | 搜索关键词（匹配文件名和路径） |
| `sort` | `mtime` | 排序字段：`name` / `size` / `mtime` |
| `order` | `desc` | 排序方向：`asc` / `desc` |

**文件预览/下载参数**：

| 参数 | 说明 |
|------|------|
| `download` | 存在即强制下载 |
| `w` | 图片缩放宽度 |
| `h` | 图片缩放高度 |
| `q` | 图片质量 1-100 |
| `format` | 输出格式：webp / jpeg / png |

**协商缓存**：GET 文件接口支持 `ETag` 和 `If-None-Match`，返回 `304`。

### 随机图片

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/photo` | 全局随机图片 | 否 |
| GET | `/photo/:rootId` | 指定根目录随机图片 | 否 |
| GET | `/photo/:width/:height` | 指定尺寸随机图片 | 否 |
| GET | `/photo/:rootId/:category` | 指定根目录+分类随机 | 否 |
| GET | `/photo/:rootId/:width/:height` | 指定根目录+尺寸随机 | 否 |
| GET | `/photo/:rootId/:category/:width/:height` | 指定根目录+分类+尺寸随机 | 否 |
| POST | `/photo/refresh-cache` | 手动刷新图片缓存 | 是 |

### 占位图

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/placeholder` | 默认 300×150 | 否 |
| GET | `/placeholder?width=&height=&text=&bgColor=&textColor=&fontFamily=&fontWeight=&fontSize=` | 自定义占位图 | 否 |
| GET | `/placeholder/:size` | 正方形占位图 | 否 |
| GET | `/placeholder/:width/:height` | 自定义尺寸占位图 | 否 |

### 一言

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| ALL | `/hitokoto/*path` | 代理转发到一言服务 | 否 |

---

## 架构设计要点

### 多根目录机制

通过 `resources.json` 持久化多个资源根目录配置，`ResourceRootsService` 提供 CRUD 并在变更时广播 `resource.updated` 事件。所有文件操作都通过 `safeJoin` 做路径安全校验，防止路径穿越。

### 文件索引同步

```
┌────────────────────────────────────────────────────┐
│  应用启动 (onApplicationBootstrap)                   │
│  定时任务 (@Interval 5min)                           │
│  事件触发 (@OnEvent 'resource.updated')              │
│          ↓                                          │
│  FileIndexService.syncAll()                         │
│    ├─ 清理孤立数据（不属于活跃根目录的条目）          │
│    ├─ 逐根目录 syncRoot()                           │
│    │   ├─ 读取分类子目录                              │
│    │   ├─ 递归遍历 → FileRecord[]                    │
│    │   └─ 批量 upsert（500 条/批）                   │
│    └─ 完成                                          │
└────────────────────────────────────────────────────┘
```

### 图片处理缓存

```
请求 → 计算 cacheKey (SHA-1 of path+params)
     → 检查 .cache/thumbnails/{cacheKey}.{format}
        ├─ 命中 → 直接返回磁盘缓存
        └─ 未命中 → Sharp 处理 → 写入缓存 → 返回
```

### SPA 回退中间件

`main.ts` 中注册了一个 Express 中间件：
- 无文件扩展名 **且** 非 `/api` `/docs` 路径 **且** Accept 包含 `text/html` 的 GET 请求 → 返回 `index.html`
- 其他请求正常处理

---

## 部署

### 一键打包

```bash
pnpm run deploy
```

执行 `script/deploy.js`，依次：
1. 清理并初始化 `deploy/` 目录
2. 构建后端 NestJS → `deploy/server/`
3. 构建前端 Vite（`VITE_API_BASE_URL=origin`）→ `deploy/web/`
4. 拷贝 `.env` 到 `deploy/`
5. 生成部署用 `package.json`（仅保留生产依赖）
6. 生成启动入口 `start-app.js`
7. 生成 `start.sh`、`install.sh`

### 部署结构

```
deploy/
├── server/         # 后端编译产物 (NestJS)
├── web/            # 前端静态资源 (Vue + Vite)
├── package.json    # 精简的生产依赖
├── start-app.js    # Node 启动入口
├── start.sh        # 启动脚本
├── install.sh      # 安装脚本（pnpm/yarn/npm）
└── .env            # 环境变量（从根目录 .env 拷贝）
```

### 部署步骤

```bash
# 1. 在项目根目录打包
pnpm run deploy

# 2. 将 deploy/ 目录上传到服务器
scp -r deploy/ user@server:/opt/vakao-static-hub/

# 3. 在服务器上
cd /opt/vakao-static-hub
chmod +x install.sh start.sh
./install.sh

# 4. 配置环境变量（编辑 .env 或导出）
# AUTH_USER=xxx AUTH_PASS=xxx JWT_SECRET=xxx

# 5. 启动
./start.sh
# 或 npm start
```

生产模式下，NestJS 自动挂载 `deploy/web/` 下的前端静态资源并提供 SPA fallback，前后端通过同源部署，无需额外配置 CORS 反向代理。

---

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm approve-builds` | 允许 better-sqlite3 编译 |
| `pnpm start:dev` | 启动后端（开发热重载） |
| `pnpm start:frontend` | 启动前端（开发热重载） |
| `pnpm dev` | 同时启动前后端 |
| `pnpm build` | 构建后端 |
| `pnpm typecheck` | 前后端类型检查 |
| `pnpm lint` | ESLint 校验 |
| `pnpm format` | Prettier 格式化 |
| `pnpm deploy` | 一键打包部署 |
