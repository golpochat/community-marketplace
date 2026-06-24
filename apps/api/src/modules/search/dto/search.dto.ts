import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @IsEnum(['listings', 'users', 'categories'])
  type?: 'listings' | 'users' | 'categories';

  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Min(0)
  offset?: number;
}

export class ReindexDto {
  @IsEnum(['listings', 'users', 'categories'])
  type!: 'listings' | 'users' | 'categories';
}
