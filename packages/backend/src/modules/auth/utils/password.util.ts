/**
 * 密码哈希工具
 * 基于 Node 内置 crypto.scrypt 加盐哈希，避免引入额外原生依赖
 * 存储格式：scrypt$<saltHex>$<hashHex>
 */

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

/** 对明文密码加盐哈希，返回可入库的字符串 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${PREFIX}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/** 校验明文密码与已存储的哈希是否匹配，任何格式异常都返回 false */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    return false;
  }
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const derived = (await scryptAsync(
      password,
      salt,
      expected.length,
    )) as Buffer;
    return (
      expected.length === derived.length && timingSafeEqual(expected, derived)
    );
  } catch {
    return false;
  }
}
