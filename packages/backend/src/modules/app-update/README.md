# APP 在线更新 · uni-app 客户端对接指南

> 适用模块：`packages/backend/src/modules/app-update`
> 面向：uni-app（App 平台 / Android）客户端开发。本文档全部服务端行为以后端源码为准。

---

## 1. 能力概览

app-update 模块为多应用提供整包（APK）在线更新能力：

| 能力       | 说明                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 多应用隔离 | 每个应用一个 `appKey`，版本序列、灰度、强更互不影响                     |
| 版本检查   | 以客户端上报的 `versionCode` 为**唯一判定基准**，支持灰度分桶、强制更新 |
| APK 下载   | 服务端支持 HTTP Range 断点续传、强 ETag、206/416/304 语义               |
| 事件上报   | 升级漏斗埋点（检查 → 弹窗 → 下载 → 校验 → 安装 → 新版本启动）           |
| 远程逃生口 | 服务端可随时切换强更开关、一键下架止血，无需客户端配合                  |

uni-app 客户端**只对接 3 个公开接口**，无需登录、无需 Token：

```
GET  /static/app-updates/check          版本检查
GET  /static/app-updates/download/{id}  下载 APK（Range 断点续传）
POST /static/app-updates/report         升级事件上报
```

---

## 2. 通用约定

### 2.1 Base URL 与路径前缀

- 服务全局前缀默认为 `/static`（由服务端环境变量 `STATIC_PREFIX` 控制，联调时以实际部署为准）。
- 完整示例：`https://api.example.com/static/app-updates/check?...`
- **`downloadUrl` 由服务端在 check 响应中完整下发，客户端禁止自行拼接**。服务端优先使用环境变量 `APP_PUBLIC_BASE_URL`，否则按请求 `Host` / `x-forwarded-*` 动态生成，换域名、换端口、过反向代理都不需要客户端改动。

### 2.2 响应包装

所有 **JSON 接口**（check / report）返回统一信封：

```json
{ "code": 200, "message": "成功", "data": {} }
```

业务数据在 `data` 字段内。错误时 HTTP 状态码与 `code` 一致，`data` 为 `null`：

```json
{ "code": 400, "message": "platform 仅支持 android", "data": null }
```

**例外**：download 接口成功时返回的是**二进制文件流**（不是信封）；失败时（404 等）才返回 JSON 信封。

### 2.3 参数校验严格性（重要）

服务端开启了 `whitelist + forbidNonWhitelisted`：

- **多传任何未定义的字段 → 直接 400**。请严格按本文档字段表传参，不要把公共参数（如 traceId、渠道号）塞进 query/body。
- `versionCode` 等数字字段支持字符串数字（服务端自动转型），建议直接传数字。

### 2.4 调试入口

Swagger 文档：`{baseUrl}/docs`（标签：APP 更新（客户端））。

---

## 3. 接口一：版本检查

```
GET /static/app-updates/check
```

### 3.1 请求参数（Query）

| 参数          | 必填 | 类型   | 约束                          | uni-app 取值来源                                       |
| ------------- | ---- | ------ | ----------------------------- | ------------------------------------------------------ |
| `platform`    | 是   | string | 仅支持 `android`              | 固定 `'android'`                                       |
| `appKey`      | 是   | string | 1~64 字符，`^[A-Za-z0-9_-]+$` | 应用标识，由服务端管理端预先分配                       |
| `versionCode` | 是   | int    | ≥ 0                           | `plus.runtime.versionCode`（App 平台）                 |
| `versionName` | 否   | string | 1~32                          | `plus.runtime.version`（预留统计字段，服务端暂不消费） |
| `deviceId`    | 否   | string | 1~128                         | 见 §6，**灰度分桶依赖它，必须稳定**                    |

uni.request 示例：

```js
const res = await uni.request({
  url: `${BASE_URL}/static/app-updates/check`,
  method: 'GET',
  timeout: 10000,
  data: {
    platform: 'android',
    appKey: 'xiaolv',
    versionCode: Number(plus.runtime.versionCode),
    deviceId: getDeviceId(),
  },
});
// res.data = { code: 200, message: '成功', data: {...} }
const result = res.data?.data;
```

### 3.2 响应（data 字段）

**无更新**（含应用不存在、服务端版本 ≤ 客户端版本）：

```json
{ "hasUpdate": false }
```

注意：`appKey` 不存在时也返回 `hasUpdate: false`，**不会返回 404/400**，客户端无需区分。

**有更新**：

```json
{
  "hasUpdate": true,
  "appKey": "xiaolv",
  "versionCode": 102,
  "versionName": "1.0.2",
  "updateType": "apk",
  "forceUpdate": false,
  "downloadUrl": "https://api.example.com/static/app-updates/download/12",
  "packageSize": 23841792,
  "checksum": "9f2c...64位十六进制",
  "updateLog": "1. 修复已知问题\n2. 性能优化",
  "publishTime": 1758800000000
}
```

| 字段                          | 类型           | 说明                                                      |
| ----------------------------- | -------------- | --------------------------------------------------------- |
| `versionCode` / `versionName` | int / string   | 目标版本号与展示名                                        |
| `updateType`                  | string         | 当前固定 `apk`（整包）                                    |
| `forceUpdate`                 | boolean        | **服务端已算好的最终强更结论，客户端直接服从**（见 §3.3） |
| `downloadUrl`                 | string         | 完整下载地址，直接用于下载                                |
| `packageSize`                 | int            | 包体字节数，用于进度条与空间预检                          |
| `checksum`                    | string         | 包体 SHA-256（64 位 hex），**下载完成后必须校验**         |
| `updateLog`                   | string \| null | 更新说明，可能为 null，`\n` 分行                          |
| `publishTime`                 | int            | 发布时间戳（毫秒）                                        |

### 3.3 服务端判定逻辑（客户端必读的行为契约）

1. 取该 `appKey` 下状态为「灰度 / 全量」的最高 `versionCode` 版本；
2. 若命中的是**灰度版本**且当前设备未进入灰度桶 → 回退取最高**全量**版本再判一次；
3. 无可见版本，或 `客户端 versionCode >= 服务端 versionCode` → `hasUpdate: false`（**同版本/更高版本一律无更新，不会循环提示**）；
4. 有更新时，`forceUpdate` 的最终值 = `该版本强更开关打开` **或** `客户端 versionCode < 该版本 minVersionCode`（最低兼容版本）。

客户端**不需要**自己实现灰度与强更判断，只需：

- `hasUpdate: false` → 走正常流程（可上报 `check_no_update`）；
- `hasUpdate: true` 且 `forceUpdate: false` → 弹出可取消的升级弹窗；
- `hasUpdate: true` 且 `forceUpdate: true` → 弹出**不可取消**的强更弹窗，阻断后续使用，仅提供「立即更新」。

### 3.4 调用时机建议

- App 冷启动后（`App.vue onLaunch` 或首页 `onShow`）检查一次；
- 「设置 → 关于 → 检查更新」手动触发一次（手动触发即使 `hasUpdate: false` 也建议 toast「已是最新版本」）；
- 检查请求建议超时 5~10s，失败静默，不影响启动。

---

## 4. 接口二：APK 下载

```
GET /static/app-updates/download/{id}
```

`id` 为版本记录 ID——**客户端不需要关心它，直接使用 check 返回的 `downloadUrl` 即可**。

### 4.1 成功响应头

```
HTTP/1.1 200 OK                    # 或 206 Partial Content
Content-Type: application/vnd.android.package-archive
Accept-Ranges: bytes
ETag: "apk-12-9f2c3a1b..."        # 强 ETag，由记录 ID + checksum 生成
Cache-Control: public, max-age=31536000, immutable
Content-Disposition: attachment; filename*=UTF-8''v102_1.0.2.apk
Content-Length: 23841792
```

### 4.2 Range 断点续传语义（服务端行为）

| 请求                                                                | 服务端行为                                          |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| 不带 `Range`                                                        | 200 全量下发                                        |
| `Range: bytes={start}-{end}` / `bytes={start}-` / `bytes=-{suffix}` | 206，带 `Content-Range: bytes {start}-{end}/{size}` |
| Range 语法非法 / 越界                                               | 416 + `Content-Range: bytes */{size}`               |
| `If-Range: {etag}` 与当前 ETag 一致                                 | 正常走 206；**不一致 → 200 全量**                   |
| 多区间 `bytes=0-100,200-300`                                        | 不支持                                              |

### 4.3 失败响应（JSON 信封）

| 场景                       | 状态码 | message                |
| -------------------------- | ------ | ---------------------- |
| 版本不存在 / 草稿 / 已下架 | 404    | `安装包不存在或已下架` |
| 文件记录存在但磁盘文件缺失 | 404    | `安装包文件缺失`       |

**版本被下架后，已下发的 downloadUrl 立即失效（404）**。下载中途遇到 404 应中止本次升级流程并重新 check。

### 4.4 uni-app 下载方案

**方案 A（推荐，简单场景）**：`uni.downloadFile` 全量下载，自带进度回调：

```js
const task = uni.downloadFile({
  url: downloadUrl,
  filePath: `${plus.io.convertLocalFileSystemURL('_downloads')}/update_${versionCode}.apk`,
  success: (res) => {
    if (res.statusCode === 200) verifyAndInstall(res.filePath);
    else handleDownloadFail(`http_${res.statusCode}`);
  },
  fail: () => handleDownloadFail('network_error'),
});
task.onProgressUpdate((p) => {
  // p.progress / p.totalBytesWritten / p.totalBytesExpectedToWrite
  // 进度条分母也可用 check 返回的 packageSize
});
task.abort(); // 用户取消时调用
```

**方案 B（大包/弱网，断点续传）**：`plus.downloader.createDownload`，App 平台原生下载器，支持失败重试与续传：

```js
const task = plus.downloader.createDownload(
  downloadUrl,
  { filename: '_downloads/', retry: 3, retryInterval: 5 },
  (download, status) => {
    if (status === 200) verifyAndInstall(download.filename);
    else handleDownloadFail(`http_${status}`);
  },
);
task.start();
```

> 说明：`uni.downloadFile` 每次写新文件、不支持从中间偏移续传；若产品要求大包子线弱网续传，使用方案 B 或自行分片（服务端 Range 语义完整支持，见 §4.2）。

### 4.5 完整性校验（强制）

下载完成后，对文件计算 **SHA-256（hex 小写）**，与 check 返回的 `checksum` 比对。uni-app 无内置 SHA-256，引入纯 JS 实现（如 `js-sha256`，支持 ArrayBuffer）：

```js
import { sha256 } from 'js-sha256';

function verifyChecksum(filePath, expected) {
  return new Promise((resolve) => {
    uni.getFileSystemManager().readFile({
      filePath,
      success: (res) => {
        resolve(sha256(res.data) === expected.toLowerCase());
      },
      fail: () => resolve(false),
    });
  });
}
```

- 一致 → 触发安装，上报 `download_success`；
- 不一致 → 删除文件（`uni.getFileSystemManager().unlink`），上报 `verify_fail`，提示用户重试。

校验是防篡改/防截断的关键手段，**不可省略**。

### 4.6 触发安装

```js
plus.runtime.install(
  filePath,
  { force: false },
  () => report({ event: 'install_success', ... }),
  (e) => report({ event: 'install_fail', failCode: `code_${e.code}`, ... }),
);
```

前置条件见 §8（manifest 权限配置）。**安装 Intent 的回调在很多机型上不可靠，最终成功信号以 `new_version_launch` 为准（见 §5.2）。**

---

## 5. 接口三：升级事件上报

```
POST /static/app-updates/report
Content-Type: application/json
```

单条轻量写入。**服务端约定「失败客户端无感」：上报失败必须静默吞掉，不得重试风暴、不得阻塞升级主流程。**

### 5.1 请求体

| 字段              | 必填 | 类型   | 约束       | uni-app 取值来源                        |
| ----------------- | ---- | ------ | ---------- | --------------------------------------- |
| `deviceId`        | 是   | string | 1~128      | 与 check 使用**同一个** deviceId        |
| `appKey`          | 是   | string | 同 check   | 固定配置                                |
| `event`           | 是   | string | 见下方枚举 |                                         |
| `fromVersionCode` | 否   | int    | ≥ 0        | 升级前 `plus.runtime.versionCode`       |
| `toVersionCode`   | 否   | int    | ≥ 0        | check 返回的 versionCode                |
| `failCode`        | 否   | string | 1~64       | 仅失败事件携带，自定义错误码            |
| `networkType`     | 否   | string | ≤16        | `uni.getNetworkType` 结果（wifi/4g/5g） |
| `osVersion`       | 否   | string | ≤32        | `uni.getSystemInfoSync().osVersion`     |
| `deviceModel`     | 否   | string | ≤64        | `uni.getSystemInfoSync().model`         |
| `costMs`          | 否   | int    | ≥ 0        | 耗时毫秒（下载/安装耗时）               |

**再次提醒：不要传表外字段，否则整个请求 400。**

```js
function report(payload) {
  uni
    .request({
      url: `${BASE_URL}/static/app-updates/report`,
      method: 'POST',
      timeout: 5000,
      data: {
        deviceId: getDeviceId(),
        appKey: APP_KEY,
        ...payload, // 只允许 §5.1 表内字段
      },
    })
    .catch(() => {}); // 失败客户端无感，静默吞掉
}
```

### 5.2 事件枚举与漏斗建议

| event                | 建议上报时机                                  | 建议携带字段                                                      |
| -------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `check_no_update`    | check 返回无更新时（可选）                    | fromVersionCode                                                   |
| `prompt_show`        | 升级弹窗展示                                  | fromVersionCode, toVersionCode                                    |
| `download_start`     | 开始下载                                      | fromVersionCode, toVersionCode, networkType                       |
| `download_success`   | 下载完成且校验通过                            | + costMs（下载耗时）                                              |
| `download_fail`      | 下载失败                                      | + failCode（如 `http_404` / `network_error` / `aborted`）, costMs |
| `verify_fail`        | SHA-256 校验不一致                            | failCode=`checksum_mismatch`                                      |
| `install_success`    | `plus.runtime.install` 成功回调（能拿到才报） | costMs                                                            |
| `install_fail`       | install 失败回调                              | failCode（如 `code_-2`）                                          |
| `new_version_launch` | **升级后新版本首次启动**                      | toVersionCode（= 当前新版本号）                                   |

`new_version_launch` 是最可靠的「升级成功」信号。推荐实现：升级流程开始时把目标 `versionCode` 写入本地存储，每次启动比对当前 `plus.runtime.versionCode`，若已 ≥ 目标值则上报一次并清除标记：

```js
// 开始升级时
uni.setStorageSync('upgrade_target_versionCode', targetVersionCode);

// App.vue onLaunch 中
const target = uni.getStorageSync('upgrade_target_versionCode');
if (target && Number(plus.runtime.versionCode) >= target) {
  report({ event: 'new_version_launch', toVersionCode: target });
  uni.removeStorageSync('upgrade_target_versionCode');
}
```

### 5.3 响应

```json
{ "code": 200, "message": "成功", "data": { "success": true } }
```

---

## 6. deviceId 规范（灰度正确性的前提）

服务端灰度命中公式（**线上契约，不会变更**）：

```
bucket = parseInt(sha256(deviceId).hex[0:8], 16) % 100
命中 ⇔ bucket < grayPercent
```

推论与要求：

- **同一 deviceId 命中结果恒定**。deviceId 必须跨启动、跨升级保持稳定，否则设备会时而在灰度桶内、时而在外，表现为升级提示闪烁。
- uni-app 推荐方案（二选一）：

```js
// 方案 1：5+ 设备 UUID（App 平台）
const deviceId = plus.device.uuid;

// 方案 2：首次启动自生成 UUID 并持久化（跨平台通用）
function getDeviceId() {
  let id = uni.getStorageSync('device_id');
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    uni.setStorageSync('device_id', id);
  }
  return id;
}
```

- 不传 `deviceId`：灰度版本**永远不命中**，只会看到全量版本。功能不受影响，但失去灰度观察意义。
- 长度 ≤ 128 字符。

---

## 7. uni-app 集成完整流程

```
App 启动 / 手动检查
   │  uni.request → check
   ▼
hasUpdate=false ──→ 结束（可报 check_no_update）
   │ hasUpdate=true
   ▼
弹窗（forceUpdate ? 不可取消 : 可跳过）      ──→ prompt_show
   │ 用户确认（强更直接开始）
   ▼
uni.downloadFile / plus.downloader 下载      ──→ download_start
   │  onProgressUpdate 更新进度条              → download_fail（失败，可重试）
   ▼
js-sha256 校验 checksum                      ──→ verify_fail（删文件）
   │                                          → download_success
   ▼
plus.runtime.install 调起系统安装            ──→ install_success / install_fail
   │  （同步 setStorageSync 目标 versionCode）
   ▼
新版本 onLaunch 比对 versionCode             ──→ new_version_launch（清除标记）
```

弹窗参考（弱更）：

```js
uni.showModal({
  title: `发现新版本 v${info.versionName}`,
  content: info.updateLog || '修复已知问题，建议更新',
  showCancel: !info.forceUpdate, // 强更时隐藏取消按钮
  confirmText: '立即更新',
  cancelText: '以后再说',
  success: (res) => {
    if (res.confirm) startDownload(info);
    // 强更且用户无操作出口时，需在页面层阻断继续使用
  },
});
report({
  event: 'prompt_show',
  fromVersionCode: currentCode,
  toVersionCode: info.versionCode,
});
```

> 强更场景的 UI 阻断建议用全屏自定义弹窗页面（`uni.showModal` 可被返回键绕过，强更页面需拦截 `onBackPress`）。

---

## 8. manifest 与权限配置（Android）

`manifest.json` → App 权限配置：

```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.INTERNET\"/>",
          "<uses-permission android:name=\"android.permission.REQUEST_INSTALL_PACKAGES\"/>"
        ]
      }
    }
  }
}
```

注意事项：

- Android 8.0+ 安装 APK 必须声明 `REQUEST_INSTALL_PACKAGES`；
- 若服务端是 **http**（非 https），需开启 `usesCleartextTraffic`（manifest 中配置），否则请求直接被系统拦截；
- 下载/安装仅 App 平台生效，`#ifdef APP-PLUS` 条件编译包裹升级模块；
- 云打包时请确认 `plus.runtime.versionCode` 与 manifest 中「应用版本号（code）」一致递增——**versionCode 是唯一的更新判定基准**，发版忘记递增会导致老用户收不到更新。

---

## 9. 错误与边界情况速查表

| 场景                      | 表现                           | 客户端处理                           |
| ------------------------- | ------------------------------ | ------------------------------------ |
| check 传了多余 query 字段 | 400                            | 按字段表裁剪参数                     |
| check 的 `appKey` 不存在  | 200 + `hasUpdate:false`        | 与「无更新」同样处理                 |
| 服务端版本 ≤ 客户端版本   | 200 + `hasUpdate:false`        | 正常（防循环更新设计）               |
| 设备不在灰度桶            | 200 + 全量版本（若有）或无更新 | 正常，无需感知                       |
| 下载中途版本被下架        | 404                            | 中止本次升级，重新 check             |
| 续传时文件已变化          | 200 全量（If-Range 不匹配）    | 丢弃旧文件重新下                     |
| 下载后 checksum 不匹配    | —                              | 删文件、报 verify_fail、提示重试     |
| report 任何失败           | 4xx/5xx/超时                   | 静默吞掉，不重试                     |
| `updateLog` 为 null       | —                              | 弹窗显示兜底文案                     |
| `forceUpdate` 为 true     | —                              | 弹窗不可取消、阻断使用（拦截返回键） |
| manifest 版本号未递增     | 老用户收不到更新               | 发版检查 versionCode 单调递增        |

---

## 10. 联调检查清单

- [ ] `appKey` 已在管理端创建（未创建时 check 恒返回无更新）
- [ ] check 参数无多余字段（否则 400）
- [ ] deviceId 稳定且 ≤128 字符，三个接口使用同一值
- [ ] `downloadUrl` 直接使用，未自行拼接
- [ ] 下载完成后 SHA-256 校验 `checksum`（js-sha256 或同等实现）
- [ ] `forceUpdate=true` 时弹窗不可取消且拦截 `onBackPress`
- [ ] `updateLog` 为 null 的兜底展示
- [ ] manifest 声明 `REQUEST_INSTALL_PACKAGES`；http 环境开启 cleartext
- [ ] 升级后新版本首次启动上报 `new_version_launch`
- [ ] report 失败静默，不阻塞主流程
- [ ] 发版时 manifest versionCode 单调递增
- [ ] 手动检查更新入口在无更新时有明确提示
