/**
 * 部署打包脚本
 *
 * 功能概述：
 * 1. 在项目根目录执行后端构建（NestJS）和前端构建（Vue + Vite）
 * 2. 将构建产物整理到统一的 deploy 目录，结构如下：
 *    deploy/
 *      ├── server/      后端编译后的 JS 代码（Nest build 输出）
 *      ├── web/         前端静态资源（Vite 构建输出）
 *      ├── resources/   业务资源目录（从根目录 resources 拷贝）
 *      ├── package.json 部署用 package.json（带 start 脚本）
 *      ├── start-app.js Node 启动入口（require server/main.js）
 *      ├── start.sh     启动脚本（仅启动应用）
 *      └── install.sh   安装脚本（安装生产依赖）
 *
 * 使用方式（本地或服务器）：
 * 1. 在项目根目录执行：node script/deploy.js 或 pnpm run deploy
 * 2. 将 deploy 目录整体上传到服务器
 * 3. 进入 deploy 目录：
 *    - 运行 ./install.sh 安装依赖
 *    - 运行 ./start.sh 启动服务（或 npm start）
 */

const fs = require('fs-extra');
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

// 项目关键路径
const rootDir = path.join(__dirname, '..'); // 仓库根目录（后端源码所在目录）
const backendDir = rootDir; // 后端构建在根目录执行（nest build）
const frontendDir = path.join(rootDir, 'frontend'); // 前端项目目录

// 部署输出目录结构：deploy/{web,server,resources}
const distDir = path.join(rootDir, 'deploy');
const webDistDir = path.join(distDir, 'web');
const resourcesDistDir = path.join(distDir, 'resources'); // 部署资源目录（可选）
const resourcesSourceDir = path.join(rootDir, 'resources'); // 源资源目录（可选）
const rootPackageJsonPath = path.join(rootDir, 'package.json'); // 根 package.json，用于生成部署用 package.json

/**
 * 同步执行命令的工具函数
 * - command: 要执行的 shell 命令
 * - options.cwd: 工作目录
 * - options.env: 额外注入的环境变量
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
  log('开始构建前后端并整理输出目录...', 'info');

  log('清理 deploy 目录...', 'clean');
  try {
    await fs.emptyDir(distDir);
  } catch (e) {
    log('无法完全清理 deploy 目录，可能被占用。尝试继续...', 'warning');
  }

  // 2. 构建后端（NestJS）
  log('构建后端...', 'build');
  run('pnpm run build', { cwd: backendDir });

  // 3. 构建前端（Vue + Vite），并注入后端地址为同源根路径 "/"
  log('构建前端...', 'build');
  run('pnpm run build', {
    cwd: frontendDir,
    env: {
      // 显式设置为 'origin'，配合前端逻辑自动使用 window.location.origin
      VITE_API_BASE_URL: 'origin',
    },
  });

  // 4. 将前端静态资源拷贝到 deploy/web
  log('拷贝前端到 deploy/web...', 'copy');
  await fs.ensureDir(webDistDir);
  // await fs.copy(path.join(frontendDir, 'dist'), webDistDir, { overwrite: true });
  // 移动 前端 dist 到 deploy/web
  await fs.move(path.join(frontendDir, 'dist'), webDistDir, {
    overwrite: true,
  });

  // 后端已经通过 tsconfig.build.json 输出到了 deploy/server，无需再次拷贝

  // 5. 准备资源目录 deploy/resources（如果根目录存在 resources，则整体拷贝）
  log('准备资源目录 deploy/resources...', 'copy');
  // if (await fs.pathExists(resourcesSourceDir)) {
  //   await fs.copy(resourcesSourceDir, resourcesDistDir, { overwrite: true });
  // } else {
  //   await fs.ensureDir(resourcesDistDir);
  // }

  // 5.1 复制环境变量文件 .env 到 deploy/.env (如果存在)
  const envPath = path.join(rootDir, '.env');
  if (await fs.pathExists(envPath)) {
    log('复制 .env 到 deploy/.env...', 'copy');
    await fs.copy(envPath, path.join(distDir, '.env'), { overwrite: true });
  } else {
    log(
      '未找到根目录 .env 文件，部署包将使用默认配置或系统环境变量',
      'warning',
    );
  }

  // 6. 生成部署用 package.json（只保留必要字段和 dependencies）
  log('生成 deploy/package.json...', 'build');
  const rootPackageJson = await fs.readJson(rootPackageJsonPath);
  const deployDependencies = { ...rootPackageJson.dependencies };
  const deployPackageJson = {
    name: rootPackageJson.name || 'vakao-static-hub',
    version: rootPackageJson.version || '0.0.1',
    private: false,
    scripts: {
      start: 'node start-app.js',
    },
    dependencies: deployDependencies,
    pnpm: rootPackageJson.pnpm || {},
  };
  await fs.writeJson(path.join(distDir, 'package.json'), deployPackageJson, {
    spaces: 2,
    encoding: 'utf8',
  });

  const startAppScriptPath = path.join(distDir, 'start-app.js');
  const startShPath = path.join(distDir, 'start.sh');
  const installShPath = path.join(distDir, 'install.sh');

  // 7. 生成 Node 启动入口 start-app.js（内部 require server/main.js）
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

  // 8. 生成启动脚本 start.sh（只负责启动应用）
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

  // 9. 生成安装脚本 install.sh（安装生产依赖，优先使用 pnpm）
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

  // 10. 在支持 chmod 的系统中为脚本增加可执行权限
  try {
    await fs.chmod(startAppScriptPath, 0o755);
    await fs.chmod(startShPath, 0o755);
    await fs.chmod(installShPath, 0o755);
  } catch {}

  // 11. 输出最终目录结构
  separator();
  showSuccess('构建完成，输出目录结构:');
  log(`${colors.magenta}  deploy/${colors.reset}`);
  log(`${colors.magenta}    ├── web/${colors.reset}`);
  log(`${colors.magenta}    ├── server/${colors.reset}`);
  log(`${colors.magenta}    ├── resources/${colors.reset}`);
  log(`${colors.magenta}    ├── package.json${colors.reset}`);
  log(`${colors.magenta}    ├── start-app.js${colors.reset}`);
  log(`${colors.magenta}    ├── start.sh${colors.reset}`);
  log(`${colors.magenta}    └── install.sh${colors.reset}`);
}

main().catch((err) => {
  handleError('构建失败', err);
});