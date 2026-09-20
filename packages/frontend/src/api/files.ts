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
