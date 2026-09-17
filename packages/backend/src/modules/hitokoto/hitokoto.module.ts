import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HitokotoController } from './hitokoto.controller';
import { HitokotoProxyMiddleware } from './hitokoto.proxy.middleware';

@Module({
  controllers: [HitokotoController],
})
export class HitokotoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HitokotoProxyMiddleware).forRoutes('hitokoto');
  }
}
