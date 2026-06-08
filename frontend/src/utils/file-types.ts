export const supportedExtensions = [
  // PDF
  'pdf',
  // Word
  'doc',
  'docx',
  // Excel
  'xls',
  'xlsx',
  // CSV
  'csv',
  // PPT
  'ppt',
  'pptx',
  // Markdown
  'md',
  'markdown',
  // TXT
  'txt',
  // HTML
  'html',
  'htm',
  // OFD
  'ofd',
  // DXF
  'dxf',
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'webp',
  'svg',
  'ico',
  'avif',
  // Video
  'mp4',
  'mov',
  'webm',
  'avi',
  'mkv',
  // Audio
  'mp3',
  'wav',
  'ogg',
  // Code
  'js',
  'ts',
  'jsx',
  'tsx',
  'css',
  'json',
  'xml',
  'yaml',
  'yml',
  'go',
  'py',
  'java',
  'cpp',
  'c',
  'rs',
  'rb',
  'php',
];

export const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

export const imageExtensions = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'webp',
  'svg',
  'ico',
  'avif',
];

export const getFileExtension = (path: string): string => {
  return path.split('.').pop()?.toLowerCase() || '';
};

export const isImage = (path: string): boolean => {
  const ext = getFileExtension(path);
  return imageExtensions.includes(ext);
};

export const isSupported = (path: string): boolean => {
  const ext = getFileExtension(path);
  return supportedExtensions.includes(ext);
};

export const isArchive = (path: string): boolean => {
  const ext = getFileExtension(path);
  return archiveExtensions.includes(ext);
};
