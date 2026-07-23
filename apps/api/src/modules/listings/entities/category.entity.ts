import { BaseEntity } from '../../../common/entities/base.entity';

export class CategoryEntity extends BaseEntity {
  name!: string;
  slug!: string;
  description?: string;
  parentId?: string;
  isActive!: boolean;
  requiresReview!: boolean;
  isHidden!: boolean;
}
