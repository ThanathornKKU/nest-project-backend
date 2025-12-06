// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { Kafka, Producer } from 'kafkajs';
// import { ConfigService } from '@nestjs/config';
// import { randomUUID } from 'crypto';

// @Injectable()
// export class KafkaService implements OnModuleInit, OnModuleDestroy {
//   // เก็บ instance ของ kafkajs producer
//   private producer: Producer;

//   constructor(private readonly configService: ConfigService) {
//     // อ่าน brokers จาก .env (เช่น "localhost:9092" หรือ "kafka:9092")
//     // Non-null assertion (!) เพราะเราคาดว่าจะต้องมีค่าใน .env
//     const brokers = this.configService.get<string>('KAFKA_BROKERS')!.split(',');

//     // สร้าง clientId ที่เป็น unique (ช่วย debug / tracking ได้ดี)
//     const clientId = `nestjs-${randomUUID()}`;

//     // สร้าง Kafka client (kafkajs)
//     const kafka = new Kafka({
//       clientId,
//       brokers,
//     });

//     // สร้าง Producer instance (จะ connect ใน onModuleInit)
//     this.producer = kafka.producer();
//   }

//   // เมื่อ module ถูกเริ่ม (Nest lifecycle hook) ให้ connect ไปที่ Kafka broker
//   async onModuleInit() {
//     await this.producer.connect();
//     console.log('[Kafka] Producer connected');
//   }

//   // เมื่อ module ถูกปิด (เช่น app shutdown) ให้ disconnect เพื่อปล่อย resource
//   async onModuleDestroy() {
//     try {
//       await this.producer.disconnect();
//       console.log('[Kafka] Producer disconnected');
//     } catch (err) {
//       console.warn('[Kafka] Error during disconnect', err);
//     }
//   }

//   /**
//    * emit(eventName, payload)
//    * - eventName: ชื่อเหตุการณ์ เช่น 'cat.created'
//    * - payload: object ที่ต้องการส่ง
//    *
//    * ฟอร์แมต message เป็นแบบ { event, data, timestamp } (เพื่อนใช้แบบนี้)
//    */
//   async emit(eventName: string, payload: object) {
//     // ตั้งชื่อ topic ที่จะใช้เป็น "event-bus"
//     const DEFAULT_TOPIC = 'product.events';

//     // สร้าง message payload ตาม convention
//     const message = {
//       event: eventName,
//       data: payload,
//       timestamp: new Date().toISOString(),
//     };

//     // ส่งไปที่ topic ที่กำหนด (DEFAULT_TOPIC)
//     await this.producer.send({
//       topic: DEFAULT_TOPIC,
//       messages: [{ value: JSON.stringify(message) }],
//     });

//     console.log(
//       `[Kafka] Emit -> topic="${DEFAULT_TOPIC}" event="${eventName}"`,
//       message,
//     );
//   }
// }
