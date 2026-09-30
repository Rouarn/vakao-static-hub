import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  user: string;
  pass: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export const authConfigFactory = registerAs('auth', (): AuthConfig => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'change-me-in-env') {
    throw new Error(
      'JWT_SECRET 未配置或仍为不安全的默认值 change-me-in-env，请在 .env 中设置随机密钥后再启动',
    );
  }
  const user = process.env.AUTH_USER;
  const pass = process.env.AUTH_PASS;
  if (!user || !pass) {
    throw new Error(
      'AUTH_USER/AUTH_PASS 未配置，首次启动需要用它们初始化管理员账号',
    );
  }
  return {
    user,
    pass,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  };
});
