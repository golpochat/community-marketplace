import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import type { ListingCondition } from '@community-marketplace/types';

export class CreateListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  price!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency!: string;

  @IsString()
  categoryId!: string;

  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'])
  condition!: ListingCondition;

  @IsString()
  @MaxLength(120)
  location!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  price?: number;

  @IsOptional()
  @IsEnum(['draft', 'active', 'sold', 'archived'])
  status?: 'draft' | 'active' | 'sold' | 'archived';

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'])
  condition?: ListingCondition;

  @IsOptional()
  @IsString()
  location?: string;
}

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UploadListingImageDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @IsOptional()
  isPrimary?: boolean;
}
