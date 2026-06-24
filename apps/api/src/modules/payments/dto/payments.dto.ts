import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  listingId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(10_000_000)
  amount!: number;

  @IsString()
  currency!: string;

  @IsEnum(['card', 'bank_transfer', 'wallet'])
  method!: 'card' | 'bank_transfer' | 'wallet';
}

export class ConnectAccountDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  refreshUrl?: string;
}

export class PaymentWebhookDto {
  @IsString()
  type!: string;

  @IsString()
  stripeEventId!: string;
}
