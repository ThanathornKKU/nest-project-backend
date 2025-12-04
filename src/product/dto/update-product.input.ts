import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Name ต้องเป็นตัวอักษร' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Description ต้องเป็นตัวอักษร' })
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Price ต้องเป็นตัวเลข' })
  @Min(0, { message: 'Price ต้องไม่ติดลบ' })
  price?: number;
}
