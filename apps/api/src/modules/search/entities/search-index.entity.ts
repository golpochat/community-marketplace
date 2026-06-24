import { BaseEntity } from '../../../common/entities/base.entity';

export type SearchIndexType = 'listings' | 'users' | 'categories';

export class SearchIndexEntity extends BaseEntity {
  indexName!: string;
  type!: SearchIndexType;
  documentCount!: number;
  lastSyncedAt?: Date;
}
