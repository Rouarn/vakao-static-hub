import { registerAs } from '@nestjs/config';
import { join, resolve } from 'path';

export interface DatabaseConfig {
  path: string;
  synchronize: boolean;
}

export const databaseConfigFactory = registerAs(
  'db',
  (): DatabaseConfig => ({
    path: resolve(
      process.env.DB_PATH ?? join(process.cwd(), 'resources', 'vakao.db'),
    ),
    synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
  }),
);
