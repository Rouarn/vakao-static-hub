import { get, post, patch, del } from '../utils/request';
import { http } from '../utils/request';
import type {
  ResourceRoot,
  FileItem,
  FileConfig,
  PagedResult,
} from '@vakao/shared';

export function getRoots() {
  return get<ResourceRoot[]>('/roots');
}

export function addRoot(root: ResourceRoot) {
  return post<ResourceRoot[]>('/roots', root);
}

export function updateRoot(
  id: string,
  root: Partial<Omit<ResourceRoot, 'id'>>,
) {
  return patch<ResourceRoot[]>(`/roots/${id}`, root);
}

export function removeRoot(id: string) {
  return del<{ success: true }>(`/roots/${id}`);
}

export function getFileConfig() {
  return get<FileConfig>('/files/config');
}

export function getCategories(rootId: string) {
  return get<string[]>(`/files/${rootId}/categories`);
}

export function renameCategory(
  rootId: string,
  category: string,
  newCategory: string,
) {
  return patch<{ category: string }>(
    `/files/${rootId}/categories/${encodeURIComponent(category)}`,
    { newCategory },
  );
}

export function getFiles(
  rootId: string,
  category: string,
  params: {
    page: number;
    pageSize: number;
    q?: string;
    sort?: string;
    order?: string;
  },
) {
  return get<PagedResult<FileItem>>(
    `/files/${rootId}/${encodeURIComponent(category)}`,
    { params },
  );
}

export interface UsageCategory {
  category: string;
  totalSize: number;
  fileCount: number;
}

export interface UsageRoot {
  rootId: string;
  rootName: string;
  totalSize: number;
  fileCount: number;
  categories: UsageCategory[];
}

export interface UsageStatsResult {
  roots: UsageRoot[];
  totalSize: number;
  fileCount: number;
}

export function getUsageStats() {
  return get<UsageStatsResult>('/files/stats/usage');
}

export interface DuplicateFileItem {
  rootId: string;
  category: string;
  relPath: string;
  name: string;
  size: number;
  mtime: number;
}

export interface DuplicateGroup {
  contentHash: string;
  size: number;
  count: number;
  files: DuplicateFileItem[];
}

export interface DuplicateScanResult {
  groups: DuplicateGroup[];
  groupCount: number;
  duplicateFileCount: number;
  /** 本次扫描惰性补算哈希的文件数 */
  hashedCount: number;
}

export function getDuplicates(rootId?: string) {
  return get<DuplicateScanResult>('/files/duplicates', {
    params: rootId ? { rootId } : undefined,
  });
}

export interface UploadOptions {
  onUploadProgress?: (e: any) => void;
}

export function uploadFile(
  rootId: string,
  category: string,
  file: File,
  options?: UploadOptions,
) {
  const fd = new FormData();
  fd.append('files', file);
  fd.append('category', category);
  return http.post(`/files/${rootId}/upload`, fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: options?.onUploadProgress,
  });
}

// ==================== 大文件分片上传 ====================

export interface ChunkUploadInitResult {
  uploadId: string;
  chunkSize: number;
  uploadedChunks: number[];
}

export function initChunkUpload(
  rootId: string,
  category: string,
  filename: string,
  size: number,
  chunkSize: number,
) {
  return post<ChunkUploadInitResult>('/files/upload/init', {
    rootId,
    category,
    filename,
    size,
    chunkSize,
  });
}

export function uploadChunk(uploadId: string, index: number, chunk: Blob) {
  const fd = new FormData();
  fd.append('chunk', chunk);
  return http.post(
    `/files/upload/chunk?uploadId=${uploadId}&index=${index}`,
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

export function completeChunkUpload(
  uploadId: string,
  rootId: string,
  category: string,
  filename: string,
  size: number,
) {
  return post<{ name: string; path: string; size: number; mtime: number }>(
    '/files/upload/complete',
    { uploadId, rootId, category, filename, size },
  );
}

export function cancelChunkUpload(uploadId: string) {
  return post<{ success: boolean }>('/files/upload/cancel', { uploadId });
}

export interface BatchDeleteResult {
  deletedCount: number;
}

export function batchDeleteFiles(
  rootId: string,
  category: string,
  paths: string[],
) {
  return post<BatchDeleteResult>('/files/batch-delete', {
    rootId,
    category,
    paths,
  });
}

export interface BatchMoveResultItem {
  path: string;
  success: boolean;
  error?: string;
}

export interface BatchMoveResult {
  results: BatchMoveResultItem[];
  movedCount: number;
}

export function batchMoveFiles(
  rootId: string,
  category: string,
  paths: string[],
  targetCategory: string,
) {
  return post<BatchMoveResult>('/files/batch-move', {
    rootId,
    category,
    paths,
    targetCategory,
  });
}

export function deleteFile(rootId: string, category: string, path: string) {
  const encodedCategory = encodeURIComponent(category);
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return del<null>(`/files/${rootId}/${encodedCategory}/${encodedPath}`);
}

export function renameFile(
  rootId: string,
  category: string,
  path: string,
  newName: string,
) {
  const encodedCategory = encodeURIComponent(category);
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return patch<FileItem>(`/files/${rootId}/${encodedCategory}/${encodedPath}`, {
    newName,
  });
}

export function syncFileIndex() {
  return post<{ message: string }>('/files/sync');
}

export function getSystemDirectories(path?: string) {
  return get<any[]>('/roots/system/directories', { params: { path } });
}
