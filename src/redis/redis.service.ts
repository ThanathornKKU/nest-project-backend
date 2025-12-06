import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
// Implements OnModuleDestroy เพื่อให้ NestJS เรียกอัตโนมัติเมื่อโมดูลถูกทำลาย (เช่น ตอนปิดแอป)
// ใช้เพื่อปิด Redis connection อย่างถูกต้องและป้องกัน connection leak
export class RedisService implements OnModuleDestroy {
  // สร้างตัวแปร client สำหรับเก็บ instance ของ ioredis
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    // อ่านค่าต่าง ๆ จากไฟล์ .env
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');

    // สร้างการเชื่อมต่อ Redis Server
    this.client = new Redis({
      host,
      port,
    });

    // Listener: ทำงานเมื่อเชื่อมต่อ Redis ได้สำเร็จ
    this.client.on('connect', () => {
      console.log('✅ [Redis] connected');
    });

    // Listener: ทำงานเมื่อเกิดข้อผิดพลาดกับ Redis connection
    this.client.on('error', (err) => {
      console.error('❌ [Redis] connection error:', err);
    });
  }

  async set(key: string, value: any, expireSeconds?: number) {
    // แปลง object/string/array → JSON string
    const data = JSON.stringify(value);
    // ถ้ามีการกำหนดเวลาหมดอายุ (EXPIRE)
    if (expireSeconds) {
      // สั่งให้ Redis เก็บค่าพร้อมกำหนด expire time เป็นวินาที
      return this.client.set(key, data, 'EX', expireSeconds);
    }

    // ถ้าไม่มี expire ก็เก็บปกติแบบไม่มีวันหมดอายุ
    return this.client.set(key, data);
  }

  // T กำหนดชนิดข้อมูลที่ return (Generics)
  // ตัวอย่างการใช้งาน: const product = await redisService.get<Product>('product:123');
  // ทำให้ฟังก์ชัน get() คืนค่าที่ “มี type ถูกต้อง” ช่วยให้ TypeScript ตรวจสอบและช่วยเขียนโค้ดได้ปลอดภัยขึ้น
  async get<T = any>(key: string): Promise<T | null> {
    // ดึง string ที่เก็บเอาไว้ใน Redis
    const result = await this.client.get(key);

    // ถ้ามีข้อมูล ->  แปลง JSON string → object/string/array ตามชนิด T
    // ถ้าไม่มี -> null
    // ใช้ as T → ให้ TypeScript ตรวจ property ผิด–ถูกได้ตั้งแต่ compile-time
    return result ? (JSON.parse(result) as T) : null;
  }

  // ลบข้อมูลตาม key ที่กำหนด คืนค่าเป็นจำนวน key ที่ถูกลบ (0 หรือ 1)
  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }

  //  ใช้สำหรับปิด connection ของ Redis ให้เรียบร้อย
  //  เพื่อป้องกัน connection leak หรือ connection ค้าง
  async onModuleDestroy() {
    await this.client.quit();
  }
}
