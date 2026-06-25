import { registerAs } from '@nestjs/config';

export interface ScheduleConfig {
  cacheRefreshInterval: number;
}

export const scheduleConfigFactory = registerAs(
  'schedule',
  (): ScheduleConfig => ({
    cacheRefreshInterval: Number(
      process.env.CACHE_REFRESH_INTERVAL_MS ?? 5 * 60 * 1000,
    ),
  }),
);
