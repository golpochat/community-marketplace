import { BaseEntity } from '../../../common/entities/base.entity';
import type { ListingCondition, ListingStatus } from '@community-marketplace/types';

export class ListingEntity extends BaseEntity {
  sellerId!: string;
  title!: string;
  description!: string;
  price!: number;
  currency!: string;
  categoryId!: string;
  condition!: ListingCondition;
  status!: ListingStatus;
  location!: string;
}
