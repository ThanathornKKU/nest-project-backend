import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  // ให้ NestJS รู้จัก RedisService ว่าเป็น service ที่สามารถ inject ได้
  providers: [RedisService],
  // อนุญาตให้ module อื่น ใช้ RedisService ได้
  exports: [RedisService],
})
export class RedisModule {}
