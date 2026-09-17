import { http } from '@/utils/request';

export const buildFileUrl = (
  rootId: string,
  category: string,
  path: string,
) => {
  const base = (http.defaults.baseURL || window.location.origin).replace(
    /\/$/,
    '',
  );
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/files/${rootId}/${encodeURIComponent(category)}/${encodedPath}`;
};
