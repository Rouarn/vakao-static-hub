import type { Response, Request } from 'express';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { getMimeType, isPreviewable } from '../modules/files/utils/mime-types';

export interface FileServeOptions {
  download?: string;
  cacheControl?: string;
}

export async function serveStaticFile(
  fullPath: string,
  filename: string,
  req: Request,
  res: Response,
  options: FileServeOptions = {},
) {
  const s = await stat(fullPath);
  const mimeType = getMimeType(filename);

  const etag = `W/"${s.size}-${s.mtimeMs}"`;
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', s.mtime.toUTCString());
  res.setHeader(
    'Cache-Control',
    options.cacheControl ?? 'private, max-age=0, must-revalidate',
  );

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.setHeader('Content-Length', s.size.toString());
  res.setHeader('Content-Type', mimeType);

  const disposition =
    isPreviewable(mimeType) && options.download === undefined
      ? 'inline'
      : 'attachment';

  if (disposition === 'attachment') {
    const encodedFilename = encodeURIComponent(basename(filename));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFilename}`,
    );
  } else {
    res.setHeader('Content-Disposition', disposition);
  }

  createReadStream(fullPath).pipe(res);
}
