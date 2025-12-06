import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schema/product.schema';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProductsService {
  // กำหนด TTL (Time To Live) เป็นหน่วย (วินาที) สำหรับ cache list
  private readonly LIST_CACHE_TTL = 60;

  constructor(
    // Inject Mongoose model สำหรับ query DB
    @InjectModel(Product.name) private productModel: Model<Product>,

    // Inject RedisService (คุณต้อง export RedisService จาก RedisModule)
    private readonly redis: RedisService,
  ) {}

  /**
   * findAll()
   * - พยายามดึงจาก Redis ก่อน (key: 'products')
   * - ถ้าเจอ → คืนค่าจาก cache (ไม่ต้อง query DB)
   * - ถ้าไม่เจอ → query DB, เก็บผลลง Redis, แล้วคืนค่า
   */
  async findAll(): Promise<Product[]> {
    const cacheKey = 'products';

    // ลองดึงจาก Redis ก่อน
    const cached = await this.redis.get<Product[]>(cacheKey);
    console.log('✅ CACHE GET products:', cached);

    if (cached) {
      return cached;
    }

    // ถ้าไม่มีใน cache → query จาก MongoDB
    const products = await this.productModel.find();

    // เก็บผลลัพธ์ลง Redis ระบุเวลาหมดอายุด้วย LIST_CACHE_TTL วินาที
    await this.redis.set(cacheKey, products, this.LIST_CACHE_TTL);
    console.log('📌 CACHE SET products:', products);

    return products;
  }

  /**
   * findOne(id)
   * - พยายามดึงจาก Redis ตาม key `product:{id}`
   * - ถ้าไม่มี → query จาก DB และ cache ผลลัพธ์
   */
  async findOne(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;

    // ลองดึงจาก Redis ก่อน
    const cached = await this.redis.get<Product>(cacheKey);
    console.log('✅ CACHE GET product:', cached);
    if (cached) {
      return cached;
    }

    // ถ้าไม่มีใน cache → query DB
    const product = await this.productModel.findById(id);

    if (!product) {
      // ถ้าไม่มี product -> throw NotFound
      throw new NotFoundException(`Product ${id} not found`);
    }

    // เก็บลง Redis (cache รายตัว)
    await this.redis.set(cacheKey, product, this.LIST_CACHE_TTL);
    console.log('📌 CACHE SET product:', product);

    return product;
  }

  /**
   * create(input)
   * - ตรวจสอบ unique name (simple check ก่อนเรียก DB create)
   * - สร้าง document ใหม่ใน MongoDB
   * - invalidate cache list (products) เพราะ data เปลี่ยน
   * - (เลือก) สามารถ publish event ไป Kafka ได้ที่นี่ด้วย ถ้ามี
   */
  async create(input: CreateProductInput): Promise<Product> {
    // ตรวจสอบชื่อซ้ำก่อน (เพื่อให้ user ได้ error ที่ชัดเจน)
    const existing = await this.productModel.findOne({ name: input.name });
    // ถ้ามีชื่อซ้ำ
    if (existing) {
      throw new BadRequestException('Product name already exists');
    }

    // สร้าง product ใหม่ (ใช้ create ของ mongoose)
    const created = await this.productModel.create(input);

    // ล้าง cache list เพื่อให้ไปดึงข้อมูลจาก DB ใหม่
    await this.redis.delete('products');
    console.log('❌ CACHE DELETE products:', 'products');

    return created;
  }

  /**
   * update(id, input)
   * - อัปเดตข้อมูลใน DB
   * - ล้าง cache ที่เกี่ยวข้อง: list + รายตัว
   */
  async update(id: string, input: UpdateProductInput): Promise<Product> {
    // หา product ที่ชื่อซ้ำ แต่ไม่ใช่ product ตัวนี้
    const existing = await this.productModel.findOne({
      name: input.name,
      _id: { $ne: id }, // $ne = not equal
    });

    if (existing) {
      throw new BadRequestException('Product name already exists');
    }
    // update แบบ findByIdAndUpdate เพื่อคืนค่าหลังแก้ไข (new: true)
    const updated = await this.productModel.findByIdAndUpdate(id, input, {
      new: true,
    });

    if (!updated) {
      // ไม่พบ -> throw NotFound
      throw new NotFoundException(`Product ${id} not found`);
    }

    // ล้าง cache list และ cache รายตัว (product:{id}) เพื่อให้ไปดึงข้อมูลจาก DB ใหม่
    await this.redis.delete('products');
    await this.redis.delete(`product:${id}`);
    console.log('❌ CACHE DELETE products:', 'products');
    console.log('❌ CACHE DELETE product:', `product:${id}`);

    return updated;
  }

  /**
   * delete(id)
   * - ลบจาก DB
   * - ล้าง cache ที่เกี่ยวข้อง
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // ล้าง cache list และ cache รายตัว (product:{id}) เพื่อให้ไปดึงข้อมูลจาก DB ใหม่
    await this.redis.delete('products');
    await this.redis.delete(`product:${id}`);
    console.log('❌ CACHE DELETE products:', 'products');
    console.log('❌ CACHE DELETE product:', `product:${id}`);

    return true;
  }
}
