export interface ResourceRoot {
  id: string;
  name: string;
  path: string;
}

export interface FileItem {
  name: string;
  path: string;
  size: number;
  mtime: number;
}

export interface ShareLink {
  id: number;
  token: string;
  rootId: string;
  category: string;
  filePath: string;
  expiresAt: number | null;
  maxAccesses: number | null;
  accessCount: number;
  createdAt: number;
}

export interface CreateShareLinkParams {
  rootId: string;
  category: string;
  filePath: string;
  expiresInMs?: number;
  maxAccesses?: number;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'mtime';
export type SortOrder = 'asc' | 'desc';
