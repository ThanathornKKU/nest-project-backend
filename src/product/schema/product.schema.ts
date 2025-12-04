import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'products' })
export class Product extends Document {
  // ชื่อสินค้า (required)
  @Prop({ required: true, unique: true })
  name: string;

  // คำอธิบายสินค้า (optional)
  @Prop()
  description?: string;

  // ราคา (required) Mongoose validation price >= 0
  @Prop({ required: true, min: 0 })
  price: number;
}

// แปลง class เป็น Mongoose schema ที่จะถูกใช้ใน MongooseModule.forFeature()
export const ProductSchema = SchemaFactory.createForClass(Product);
