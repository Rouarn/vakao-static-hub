import { registerAs } from '@nestjs/config';

export interface ServerConfig {
  port: number;
  bodyLimit: string;
  staticPrefix: string;
}

export const serverConfigFactory = registerAs(
  'server',
  (): ServerConfig => ({
    port: Number(process.env.PORT ?? 9865),
    bodyLimit: process.env.BODY_LIMIT ?? '10mb',
    staticPrefix: process.env.STATIC_PREFIX ?? 'static',
  }),
);
