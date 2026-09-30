/**
 * jit-viewer 懒加载器
 *
 * jit-viewer 构建产物约 10MB（gzip 2.8MB+），包含 pdfjs、three.js、Office 渲染器等。
 * 只能在用户真正触发预览时通过动态 import 加载，避免进入首页时被静态依赖拖入首屏。
 * 加载结果会被缓存，重复调用只拉取一次；页面空闲时可调用 prefetchJitViewer 预热。
 */
type JitViewerModule = typeof import('jit-viewer');

let loaderPromise: Promise<JitViewerModule> | null = null;
let prefetchScheduled = false;

export function loadJitViewer(): Promise<JitViewerModule> {
  if (!loaderPromise) {
    const promise = Promise.all([
      import('jit-viewer'),
      import('jit-viewer/style.css'),
    ]).then(([mod]) => mod);
    // 加载失败（网络抖动/chunk 失效）时清空缓存，允许后续点击重试
    promise.catch(() => {
      loaderPromise = null;
    });
    loaderPromise = promise;
  }
  return loaderPromise;
}

/**
 * 浏览器空闲时预取 jit-viewer，使首次点击预览时 chunk 大概率已在缓存中。
 * 不阻塞首屏渲染；开启省流模式（save-data）时跳过；预取失败允许后续点击重试。
 */
export function prefetchJitViewer(): void {
  if (loaderPromise || prefetchScheduled) return;

  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (conn?.saveData) return;

  prefetchScheduled = true;

  const schedule: (cb: () => void) => void =
    'requestIdleCallback' in window
      ? (cb) => window.requestIdleCallback(cb, { timeout: 3000 })
      : (cb) => window.setTimeout(cb, 1);

  schedule(() => {
    loadJitViewer().catch(() => {
      loaderPromise = null;
      prefetchScheduled = false;
    });
  });
}

export type { ViewerInstance } from 'jit-viewer';
