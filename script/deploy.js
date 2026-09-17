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
const serverDistDir = path.join(distDir, 'server'); // nest build 已输出到这里
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

  // 3. 构建后端（NestJS），输出到 deploy/server
  log('构建 @vakao/backend...', 'build');
  run('pnpm --filter @vakao/backend build', { cwd: rootDir });

  // 4. 构建前端（Vue + Vite），注入同源 API 地址
  log('构建 @vakao/frontend...', 'build');
  run('pnpm --filter @vakao/frontend build', {
    cwd: rootDir,
    env: {
      VITE_API_BASE_URL: 'origin',
    },
  });

  // 5. 移动前端静态资源到 deploy/web
  log('拷贝前端到 deploy/web...', 'copy');
  await ensureDir(webDistDir);
  await move(path.join(frontendDir, 'dist'), webDistDir, {
    overwrite: true,
  });

  // 6. 把 shared 编译产物拷贝到 deploy/server/shared，
  //    供 deploy/package.json 中 "@vakao/shared": "file:./server/shared" 引用
  log('拷贝 @vakao/shared 到 deploy/server/shared...', 'copy');
  await ensureDir(sharedInServerDir);
  await copy(path.join(sharedDir, 'dist'), path.join(sharedInServerDir, 'dist'), {
    overwrite: true,
  });
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
      "const path = require('path');",
      '',
      'process.chdir(__dirname);',
      '',
      "require(path.join(__dirname, 'server', 'main.js'));",
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
      'if command -v pnpm >/dev/null 2>&1; then',
      '  pnpm install --prod',
      'elif command -v yarn >/dev/null 2>&1; then',
      '  yarn install --production',
      'else',
      '  npm install --production',
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
