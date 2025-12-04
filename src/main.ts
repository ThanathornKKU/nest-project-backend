import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // สร้างตัวแอป NestJS โดยใช้ AppModule
  const app = await NestFactory.create(AppModule);
  
  // เปิด validation pipe สำหรับทุก request
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // ตัด property ที่ไม่อยู่ใน DTO
      forbidNonWhitelisted: true, // ถ้ามี field ที่ไม่อยู่ใน DTO → throw error
      transform: true,       // แปลง type ตาม DTO เช่น string -> number
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/graphql`);
}
bootstrap();
