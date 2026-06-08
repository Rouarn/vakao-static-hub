/**
 * 定时任务配置
 * 定义缓存刷新等定时任务的配置参数
 */

import { registerAs } from '@nestjs/config';

/**
 * 定时任务配置对象
 * 包含缓存刷新间隔等设置
 * @property {number} cacheRefreshInterval - 缓存刷新间隔（毫秒）
 * 这个计算是用来将时间单位转换为毫秒的，因为 JavaScript 和 NestJS 的定时任务使用毫秒作为时间单位。
 *
 * 具体分解：
 *
 * 5：表示 5 分钟（时间间隔的分钟数）
 * 60：表示 1 分钟 = 60 秒（将分钟转换为秒）
 * 1000：表示 1 秒 = 1000 毫秒（将秒转换为毫秒）
 * 所以 5 * 60 * 1000 的计算过程是：
 *
 * 5 分钟 × 60 秒/分钟 × 1000 毫秒/秒 = 300,000 毫秒
 * 300,000 毫秒 = 5 分钟
 * 这样设置后，定时任务每隔 5 分钟会自动执行一次缓存刷新。如果要改为其他时间，比如 10 分钟，就改成 10 * 60 * 1000。
 */
export const scheduleConfig = {
  // 缓存刷新间隔（毫秒），默认 5 分钟
  cacheRefreshInterval: Number(
    process.env.CACHE_REFRESH_INTERVAL_MS ?? 5 * 60 * 1000,
  ), // 5 minutes
};

export const scheduleConfigFactory = registerAs(
  'schedule',
  () => scheduleConfig,
);
