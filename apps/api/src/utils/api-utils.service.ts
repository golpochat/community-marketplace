import { Injectable } from '@nestjs/common';

import { slugify } from '@community-marketplace/utils';

@Injectable()
export class ApiUtilsService {
  slugify(text: string): string {
    return slugify(text);
  }

  paginate<T>(items: T[], page: number, limit: number, total?: number) {
    const totalCount = total ?? items.length;
    const data =
      total !== undefined
        ? items
        : items.slice((page - 1) * limit, (page - 1) * limit + limit);

    return {
      data,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
