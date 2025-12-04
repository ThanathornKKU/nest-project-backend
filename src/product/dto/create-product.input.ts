import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty({ message: 'Name ต้องไม่ว่าง' })  // name ต้องไม่ว่าง
  @IsString({ message: 'Name ต้องเป็นตัวอักษร' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Description ต้องเป็นตัวอักษร' })
  description?: string;

  @Field(() => Float)
  @IsNotEmpty({ message: 'Price ต้องไม่ว่าง' })
  @IsNumber({}, { message: 'Price ต้องเป็นตัวเลข' })
  @Min(0, { message: 'Price ต้องไม่ติดลบ' }) // price ต้อง >= 0
  price: number;
}
