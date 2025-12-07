import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.producer.service';

@Module({
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
