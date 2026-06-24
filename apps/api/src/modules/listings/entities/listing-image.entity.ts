import { BaseEntity } from '../../../common/entities/base.entity';

export class ListingImageEntity extends BaseEntity {
  listingId!: string;
  url!: string;
  altText?: string;
  sortOrder!: number;
  isPrimary!: boolean;
}
