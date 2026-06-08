import { http } from '@/service/request/http';
import type { ApiResponse } from './auth';

/**
 * 文件管理相关 API
 */

export interface ResourceRoot {
  id: string;
  name: string;
  path: string;
}

/**
 * 获取所有资源根目录
 */
export function getRoots() {
  return http.get<ApiResponse<ResourceRoot[]>>('/roots');
}

/**
 * 添加资源根目录
 */
export function addRoot(root: ResourceRoot) {
  return http.post<ApiResponse<ResourceRoot[]>>('/roots', root);
}

/**
 * 更新资源根目录
 */
export function updateRoot(
  id: string,
  root: Partial<Omit<ResourceRoot, 'id'>>,
) {
  return http.patch<ApiResponse<ResourceRoot[]>>(`/roots/${id}`, root);
}

/**
 * 删除资源根目录
 */
export function removeRoot(id: string) {
  return http.delete<ApiResponse<{ success: true }>>(`/roots/${id}`);
}

/**
 * 获取指定根目录下的分类（一级子目录）
 */
export function getCategories(rootId: string) {
  return http.get<ApiResponse<string[]>>(`/files/${rootId}/categories`);
}

export interface FileItem {
  name: string;
  path: string;
  size: number;
  mtime: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 分页获取文件列表
 */
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
  return http.get<ApiResponse<PagedResult<FileItem>>>(
    `/files/${rootId}/${encodeURIComponent(category)}`,
    { params },
  );
}

export interface UploadOptions {
  onUploadProgress?: (e: any) => void;
}

/**
 * 上传文件
 */
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

/**
 * 删除文件
 */
export function deleteFile(rootId: string, category: string, path: string) {
  const encodedCategory = encodeURIComponent(category);
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return http.delete<ApiResponse<null>>(
    `/files/${rootId}/${encodedCategory}/${encodedPath}`,
  );
}

/**
 * 刷新图片缓存
 */
export function refreshPhotoCache() {
  return http.post<ApiResponse<{ message: string }>>('/photo/refresh-cache');
}

/**
 * 浏览服务器系统目录
 */
export function getSystemDirectories(path?: string) {
  return http.get<ApiResponse<any[]>>('/roots/system/directories', {
    params: { path },
  });
}
