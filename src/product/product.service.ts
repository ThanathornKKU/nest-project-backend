import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schema/product.schema';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductsService {
  constructor(
    // InjectModel ทำให้สามารถเรียกใช้ mongoose model เพื่อ query DB ได้
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  // ดึง product ทั้งหมดจาก MongoDB
  async findAll(): Promise<Product[]> {
    return this.productModel.find();
  }

  // ดึง product เดียวตาม id
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  // สร้าง product ใหม่
  async create(input: CreateProductInput): Promise<Product> {
    const existing = await this.productModel.findOne({ name: input.name });
    if (existing) throw new BadRequestException('Product name already exists');
    const created = await this.productModel.create(input);
    return created;
  }

  // อัปเดตข้อมูล product
  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const updated = await this.productModel.findByIdAndUpdate(id, input, {
      new: true,
    });
    if (!updated) throw new NotFoundException(`Product ${id} not found`);
    return updated;
  }

  // ลบ product
  async delete(id: string): Promise<boolean> {
    const res = await this.productModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException(`Product ${id} not found`);
    return true;
  }
}
