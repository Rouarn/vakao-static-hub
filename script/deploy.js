/**
 * 部署打包脚本（pnpm monorepo 版）
 *
 * 项目结构：
 *   packages/shared   前后端共享类型（@vakao/shared）
 *   packages/backend  NestJS 后端（@vakao/backend）
 *   packages/frontend Vue + Vite 前端（@vakao/frontend）
 *
 * 构建顺序：shared -> backend -> frontend
 * 输出目录结构：
 *   deploy/
 *     ├── server/                后端编译产物（nest build 输出）
 *     │   └── shared/            @vakao/shared 编译产物（供 file: 引用）
 *     ├── web/                   前端静态资源（Vite 构建输出）
 *     ├── .env                   环境变量（从根目录拷贝）
 *     ├── package.json           部署用 package.json（@vakao/shared 用 file: 引用）
 *     ├── start-app.js           Node 启动入口
 *     ├── start.sh               启动脚本
 *     └── install.sh             安装脚本
 *
 * 使用方式：
 *   pnpm run deploy
 *   上传 deploy/ 到服务器后运行 ./install.sh && ./start.sh
 */

const fs = require('fs/promises');
const path = require('path');
const { execSync } = require('child_process');
const {
  log,
  showBanner,
  showSuccess,
  separator,
  colors,
  handleError,
} = require('@vakao-ui/scripts-utils');

// Helper functions to replace fs-extra methods
async function emptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  const content = await fs.readFile(file, 'utf8');
  return JSON.parse(content);
}

async function writeJson(file, data, options = {}) {
  const spaces = options.spaces || 2;
  await fs.writeFile(file, JSON.stringify(data, null, spaces), 'utf8');
}

async function copy(src, dest, options = {}) {
  const srcStat = await fs.stat(src);
  if (srcStat.isDirectory()) {
    await fs.cp(src, dest, {
      recursive: true,
      force: options.overwrite ?? true,
    });
  } else {
    await fs.copyFile(src, dest);
  }
}

async function move(src, dest, options = {}) {
  try {
    await fs.rename(src, dest);
  } catch {
    // rename fails across devices, fallback to copy + remove
    await fs.cp(src, dest, {
      recursive: true,
      force: options.overwrite ?? true,
    });
    await fs.rm(src, { recursive: true, force: true });
  }
}

// 项目关键路径（monorepo 结构）
const rootDir = path.join(__dirname, '..'); // 仓库根目录
const sharedDir = path.join(rootDir, 'packages/shared');
const backendDir = path.join(rootDir, 'packages/backend');
const frontendDir = path.join(rootDir, 'packages/frontend');

// 部署输出目录结构：deploy/{web,server}
const distDir = path.join(rootDir, 'deploy');
const webDistDir = path.join(distDir, 'web');
const serverDistDir = path.join(distDir, 'server'); // 后端编译产物拷贝到这里
const sharedInServerDir = path.join(serverDistDir, 'shared'); // @vakao/shared 产物存放点

/**
 * 同步执行命令的工具函数
 */
function run(command, options = {}) {
  const { cwd, env } = options;
  execSync(command, {
    stdio: 'inherit',
    cwd,
    env: {
      ...process.env,
      ...env,
    },
  });
}

async function main() {
  // 1. 清理并初始化 deploy 目录
  showBanner('Vakao Static Hub Deploy');
  log('开始构建 monorepo 各包并整理输出目录...', 'info');

  log('清理 deploy 目录...', 'clean');
  try {
    await emptyDir(distDir);
  } catch (e) {
    log('无法完全清理 deploy 目录，可能被占用。尝试继续...', 'warning');
  }

  // 2. 构建共享类型包（前后端都依赖）
  log('构建 @vakao/shared...', 'build');
  run('pnpm --filter @vakao/shared build', { cwd: rootDir });

  // 3. 构建后端（NestJS），输出到 packages/backend/dist
  log('构建 @vakao/backend...', 'build');
  run('pnpm --filter @vakao/backend build', { cwd: rootDir });

  // 3.1.移动后端编译产物到 deploy/server
  log('移动后端产物到 deploy/server...', 'copy');
  await ensureDir(serverDistDir);
  await move(path.join(backendDir, 'dist'), serverDistDir, {
    overwrite: true,
  });

  // 4. 构建前端（Vue + Vite），注入同源 API 地址
  log('构建 @vakao/frontend...', 'build');
  run('pnpm --filter @vakao/frontend build', {
    cwd: rootDir,
    env: {
      VITE_API_BASE_URL: 'origin',
    },
  });

  // 5. 移动前端静态资源到 deploy/web
  log('移动前端到 deploy/web...', 'copy');
  await ensureDir(webDistDir);
  await move(path.join(frontendDir, 'dist'), webDistDir, {
    overwrite: true,
  });

  // 6. 把 shared 编译产物复制到 deploy/server/shared，
  //    供 deploy/package.json 中 "@vakao/shared": "file:./server/shared" 引用
  log('复制 @vakao/shared 到 deploy/server/shared...', 'copy');
  await ensureDir(sharedInServerDir);
  // 注意：必须复制（copy）而非移动（move），package.json 是受 git 跟踪的源文件，
  // 移走会损坏本地工作区（后续 install / typecheck / dev 均会失败）
  await copy(
    path.join(sharedDir, 'dist'),
    path.join(sharedInServerDir, 'dist'),
    {
      overwrite: true,
    },
  );
  await copy(
    path.join(sharedDir, 'package.json'),
    path.join(sharedInServerDir, 'package.json'),
    { overwrite: true },
  );

  // 7. 复制环境变量文件 .env 到 deploy/.env
  const envPath = path.join(rootDir, '.env');
  if (await pathExists(envPath)) {
    log('复制 .env 到 deploy/.env...', 'copy');
    await copy(envPath, path.join(distDir, '.env'), { overwrite: true });
  } else {
    log(
      '未找到根目录 .env 文件，部署包将使用默认配置或系统环境变量',
      'warning',
    );
  }

  // 8. 生成部署用 package.json（从 backend 依赖派生，@vakao/shared 改为 file: 引用）
  log('生成 deploy/package.json...', 'build');
  const backendPackageJson = await readJson(
    path.join(backendDir, 'package.json'),
  );
  const deployDependencies = { ...backendPackageJson.dependencies };
  // 将 workspace 依赖 @vakao/shared 改为 file: 引用，指向同目录下的 server/shared
  deployDependencies['@vakao/shared'] = 'file:./server/shared';
  const deployPackageJson = {
    name: 'vakao-static-hub',
    version: backendPackageJson.version || '0.0.1',
    private: false,
    type: 'module',
    scripts: {
      start: 'node start-app.js',
    },
    dependencies: deployDependencies,
  };
  await writeJson(path.join(distDir, 'package.json'), deployPackageJson, {
    spaces: 2,
  });

  const startAppScriptPath = path.join(distDir, 'start-app.js');
  const startShPath = path.join(distDir, 'start.sh');
  const installShPath = path.join(distDir, 'install.sh');

  // 9. 生成 Node 启动入口 start-app.js
  log('生成启动脚本 start-app.js...', 'build');
  await fs.writeFile(
    startAppScriptPath,
    [
      '#!/usr/bin/env node',
      "import { fileURLToPath } from 'node:url';",
      "import { dirname, join } from 'node:path';",
      '',
      'const __filename = fileURLToPath(import.meta.url);',
      'const __dirname = dirname(__filename);',
      '',
      'process.chdir(__dirname);',
      '',
      "await import(join(__dirname, 'server', 'main.js'));",
      '',
    ].join('\n'),
    { encoding: 'utf8' },
  );

  // 10. 生成启动脚本 start.sh
  log('生成启动脚本 start.sh...', 'build');
  await fs.writeFile(
    startShPath,
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      '',
      'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
      'cd "$SCRIPT_DIR"',
      '',
      'echo "Starting Vakao Static Hub..."',
      'node start-app.js',
      '',
    ].join('\n'),
    { encoding: 'utf8' },
  );

  // 11. 生成安装脚本 install.sh（安装生产依赖，优先使用 pnpm）
  //     重要：
  //     - better-sqlite3 的预编译二进制需要 GLIBC 2.33，旧版服务器（如 Alibaba Cloud Linux 8
  //       GLIBC 2.28）无法加载 → 需要从源码编译
  //     - node-gyp 12.x 使用了 walrus operator (`:=`)，要求 Python 3.8+；RHEL/Alinux 8 默认
  //       python3 是 3.6，需要装 python38 并通过 npm_config_python 指定
  log('生成安装脚本 install.sh...', 'build');
  await fs.writeFile(
    installShPath,
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      '',
      'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
      'cd "$SCRIPT_DIR"',
      '',
      'echo "Installing dependencies for Vakao Static Hub..."',
      '',
      '# 检测 Python 3.8+（node-gyp 12.x 必需，因使用 walrus operator 语法）',
      'detect_python() {',
      '  local cmd="$1"',
      '  command -v "$cmd" >/dev/null 2>&1 || return 1',
      '  local ver major minor',
      '  ver=$("$cmd" -c "import sys;v=sys.version_info;print(f\\"{v.major}.{v.minor}\\")" 2>/dev/null || echo "0.0")',
      '  major=$(echo "$ver" | cut -d. -f1)',
      '  minor=$(echo "$ver" | cut -d. -f2)',
      '  [ "$major" -gt 3 ] || ([ "$major" -eq 3 ] && [ "$minor" -ge 8 ])',
      '}',
      '',
      'PYTHON_BIN=""',
      'for cmd in python3 python3.12 python3.11 python3.10 python3.9 python3.8 python; do',
      '  if detect_python "$cmd"; then',
      '    PYTHON_BIN="$(command -v "$cmd")"',
      '    break',
      '  fi',
      'done',
      '',
      'if [ -z "$PYTHON_BIN" ]; then',
      '  echo "Python 3.8+ not found. Attempting to install..."',
      '  if command -v dnf >/dev/null 2>&1; then',
      '    # RHEL 8 / Alibaba Cloud Linux 8：默认 python3 是 3.6，需要装 python38',
      '    dnf install -y python38',
      '    command -v python3.8 >/dev/null 2>&1 && PYTHON_BIN="$(command -v python3.8)"',
      '  elif command -v yum >/dev/null 2>&1; then',
      '    # CentOS 7：默认 python3 也是 3.6，从 SCL 装 rh-python38',
      '    yum install -y centos-release-scl || true',
      '    yum install -y rh-python38 || true',
      '    [ -x /opt/rh/rh-python38/root/usr/bin/python3 ] && PYTHON_BIN=/opt/rh/rh-python38/root/usr/bin/python3',
      '  elif command -v apt-get >/dev/null 2>&1; then',
      '    apt-get update && apt-get install -y python3',
      '    command -v python3 >/dev/null 2>&1 && PYTHON_BIN="$(command -v python3)"',
      '  fi',
      'fi',
      '',
      'if [ -z "$PYTHON_BIN" ]; then',
      '  echo "ERROR: Cannot find Python 3.8+. Please install manually and re-run."',
      '  exit 1',
      'fi',
      '',
      'echo "Using Python: $PYTHON_BIN"',
      '',
      '# 创建临时 python3 shim 放在 PATH 最前面',
      '# （pnpm 11.x 自带的 node-gyp 不读 npm_config_python，只按 PATH 找 python3；',
      '#   shim 让它找到 3.8+，避免 walrus operator 语法错误）',
      'PY_SHIM="$(mktemp -d)"',
      'ln -sf "$PYTHON_BIN" "$PY_SHIM/python3"',
      'ln -sf "$PYTHON_BIN" "$PY_SHIM/python"',
      'trap \'rm -rf "$PY_SHIM"\' EXIT',
      'export PATH="$PY_SHIM:$PATH"',
      '# 多重保险：npm_config_python / PYTHON 同时设置',
      'export npm_config_python="$PYTHON_BIN"',
      'export PYTHON="$PYTHON_BIN"',
      '',
      '# 检测并安装构建工具 make / g++（源码编译必需）',
      'NEED_BUILD_TOOLS=0',
      'command -v make >/dev/null 2>&1 || NEED_BUILD_TOOLS=1',
      'command -v g++ >/dev/null 2>&1 || NEED_BUILD_TOOLS=1',
      '',
      'if [ "$NEED_BUILD_TOOLS" -eq 1 ]; then',
      '  echo "Build tools missing. Attempting to install make, g++..."',
      '  if command -v dnf >/dev/null 2>&1; then',
      '    dnf install -y make gcc-c++',
      '  elif command -v yum >/dev/null 2>&1; then',
      '    yum install -y make gcc-c++',
      '  elif command -v apt-get >/dev/null 2>&1; then',
      '    apt-get update && apt-get install -y make g++',
      '  fi',
      'fi',
      '',
      '# 强制原生模块从源码编译，跳过 prebuilt 二进制（避免 GLIBC 版本不匹配）',
      'export BETTER_SQLITE3_BUILD_FROM_SOURCE=1',
      'export npm_config_build_from_source=true',
      'export npm_config_foreground_scripts=true',
      '',
      '# 清理 better-sqlite3 内置的 prebuilt 二进制（tarball 自带 prebuilds/linux-x64.node，',
      '# 不兼容旧版 GLIBC；必须删除以强制 binding.js 使用源码编译产物 build/Release/）',
      'SQLITE3_PKG_DIR=$(ls -d node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 2>/dev/null | head -1 || true)',
      'if [ -n "$SQLITE3_PKG_DIR" ]; then',
      '  echo "Removing prebuilt better-sqlite3 binary at $SQLITE3_PKG_DIR/prebuilds..."',
      '  rm -rf "$SQLITE3_PKG_DIR/prebuilds"',
      '  rm -rf "$SQLITE3_PKG_DIR/build"',
      'fi',
      '',
      'if command -v pnpm >/dev/null 2>&1; then',
      '  pnpm install --prod',
      'elif command -v yarn >/dev/null 2>&1; then',
      '  yarn install --production',
      'else',
      '  npm install --production',
      'fi',
      '',
      '# pnpm 11.x 的 pnpm rebuild 不触发 install 脚本，需要直接调用 node-gyp',
      '# 编译 better-sqlite3（prebuilt 二进制需要 GLIBC 2.33，旧服务器不支持）',
      'SQLITE3_PKG_DIR=$(ls -d node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 2>/dev/null | head -1 || true)',
      'if [ -n "$SQLITE3_PKG_DIR" ] && [ -f "$SQLITE3_PKG_DIR/binding.gyp" ]; then',
      '  echo "Compiling better-sqlite3 from source (bypassing pnpm rebuild)..."',
      '  # 重新创建 python3 shim（之前的 trap 已清理）',
      '  GYP_PY_SHIM="$(mktemp -d)"',
      '  ln -sf "$PYTHON_BIN" "$GYP_PY_SHIM/python3"',
      '  ln -sf "$PYTHON_BIN" "$GYP_PY_SHIM/python"',
      '  # 找到 pnpm 自带的 node-gyp',
      '  NODE_GYP_BIN=$(find /root/.cache/node/corepack -path \'*/node-gyp/bin/node-gyp.js\' 2>/dev/null | head -1)',
      '  if [ -z "$NODE_GYP_BIN" ]; then',
      '    echo "ERROR: node-gyp not found in corepack cache. Cannot compile better-sqlite3."',
      '    rm -rf "$GYP_PY_SHIM"',
      '    exit 1',
      '  fi',
      '  (',
      '    cd "$SQLITE3_PKG_DIR"',
      '    PATH="$GYP_PY_SHIM:$PATH" \\',
      '    BETTER_SQLITE3_BUILD_FROM_SOURCE=1 \\',
      '    node "$NODE_GYP_BIN" rebuild',
      '  )',
      '  GYP_EXIT=$?',
      '  rm -rf "$GYP_PY_SHIM"',
      '  if [ "$GYP_EXIT" -ne 0 ]; then',
      '    echo "ERROR: better-sqlite3 compilation failed (exit code $GYP_EXIT)."',
      '    exit $GYP_EXIT',
      '  fi',
      '  echo "better-sqlite3 compiled successfully."',
      'fi',
      '',
    ].join('\n'),
    { encoding: 'utf8' },
  );

  // 12. 在支持 chmod 的系统中为脚本增加可执行权限
  try {
    await fs.chmod(startAppScriptPath, 0o755);
    await fs.chmod(startShPath, 0o755);
    await fs.chmod(installShPath, 0o755);
  } catch {}

  // 13. 输出最终目录结构
  separator();
  showSuccess('构建完成，输出目录结构:');
  log(`${colors.magenta}  deploy/${colors.reset}`);
  log(`${colors.magenta}    ├── web/${colors.reset}`);
  log(`${colors.magenta}    ├── server/${colors.reset}`);
  log(`${colors.magenta}    │   └── shared/${colors.reset}`);
  log(`${colors.magenta}    ├── package.json${colors.reset}`);
  log(`${colors.magenta}    ├── start-app.js${colors.reset}`);
  log(`${colors.magenta}    ├── start.sh${colors.reset}`);
  log(`${colors.magenta}    └── install.sh${colors.reset}`);
}

main().catch((err) => {
  handleError('构建失败', err);
});
