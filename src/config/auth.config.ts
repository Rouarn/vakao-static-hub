import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  user: string;
  pass: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export const authConfigFactory = registerAs(
  'auth',
  (): AuthConfig => ({
    user: process.env.AUTH_USER ?? 'admin',
    pass: process.env.AUTH_PASS ?? 'admin',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-env',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  }),
);
