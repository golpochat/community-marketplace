import { IsIn } from 'class-validator';

export class StartSellerOnboardingDto {
  @IsIn(['individual', 'sole_trader', 'limited_company'])
  sellerKind!: 'individual' | 'sole_trader' | 'limited_company';
}
