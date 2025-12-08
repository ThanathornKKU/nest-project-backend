import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class KafkaService implements OnModuleInit {
  // ตัวแปรเก็บ instance ของ kafkajs Producer
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    // อ่าน environment variable KAFKA_BROKERS จาก .env
    // ใช้ Non-null assertion (!) เพราะคาดว่าจะต้องมีค่าใน .env
    const brokers = this.configService.get<string>('KAFKA_BROKERS')!.split(',');

    // สร้าง clientId แบบสุ่ม (เพื่อให้แต่ละ instance มี id ต่างกัน)
    // ใช้ randomUUID() เพื่อกันซ้ำเมื่อมีหลาย instance
    const clientId = `nestjs-producer-${randomUUID()}`;

    // สร้าง Kafka client ผ่าน kafkajs โดยส่ง clientId และรายชื่อ brokers
    const kafka = new Kafka({
      clientId,
      brokers,
    });

    // สร้าง producer instance แต่ยังไม่ connect — connect จะเรียกที่ onModuleInit()
    this.producer = kafka.producer();
  }

  // เรียกอัตโนมัติเมื่อ module ถูกเริ่ม
  // connect producer กับ Kafka broker เมื่อ module ถูกเริ่ม
  async onModuleInit() {
      await this.producer.connect();
      console.log('🔥 [Kafka] Producer connected');
  }

  // ฟังก์ชัน emit ใช้ส่ง event ไปยัง topic ที่กำหนด
  // payload: object ที่ต้องการส่ง (จะถูก stringify)
  async emit(eventName: string, payload: object) {
    // สร้าง topic สำหรับส่ง event เป็นที่เก็บ event
    const topic = 'product-events';

    // สร้างรูปแบบ message ที่จะส่งไป Kafka
    const message = {
      event: eventName,
      data: payload,
      timestamp: new Date().toISOString(),
    };

    // สั่งให้ producer ส่ง message ไปยัง Kafka ตาม topic ที่กำหนด
    try {
      await this.producer.send({
        topic,
        // message ต้องเป็น string → ส่ง JSON.stringify
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`🔥 [Kafka] Emit -> Topic : ${topic}, Event : ${eventName}`, message);
    } catch (error) {
      console.error(`🔥 [Kafka] Error emitting event "${eventName}" to topic "${topic}":`, error);
    }
  }
}
