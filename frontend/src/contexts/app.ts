import { type InjectionKey, type Ref } from 'vue';
import type { ResourceRoot, FileItem } from '@/service/api/files';

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'mtime';
export type SortOrder = 'asc' | 'desc';

export interface AppContext {
  roots: Ref<ResourceRoot[]>;
  currentRootId: Ref<string>;
  categories: Ref<string[]>;
  currentCategory: Ref<string>;
  files: Ref<FileItem[]>;
  totalFiles: Ref<number>;
  page: Ref<number>;
  pageSize: Ref<number>;
  viewMode: Ref<ViewMode>;
  searchQuery: Ref<string>;
  sortBy: Ref<SortField>;
  sortOrder: Ref<SortOrder>;
  formatSize: (bytes: number) => string;
  formatDate: (value: string | number) => string;
  fileUrl: (path: string) => string;
  loadFiles: () => Promise<void>;
  switchView: (mode: ViewMode) => void;
  openDeleteModal: (path: string) => void;
  handlePageChange: (p: number) => void;
  handleSearch: () => void;
}

export const appContextKey: InjectionKey<AppContext> = Symbol('appContext');
