// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { ProductsService } from './product.service';
import { ProductsResolver } from './product.resolver';

@Module({
  imports: [
    // ลงทะเบียน schema ให้ NestJS รู้จัก (เชื่อมกับ MongoDB ที่ configure ใน AppModule)
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [ProductsService, ProductsResolver],
  exports: [ProductsService], // ถ้ามี module อื่นอยากใช้ service นี้
})
export class ProductModule {}
