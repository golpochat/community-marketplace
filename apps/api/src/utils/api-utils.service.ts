import { Injectable } from '@nestjs/common';

import { slugify } from '@community-marketplace/utils';

@Injectable()
export class ApiUtilsService {
  slugify(text: string): string {
    return slugify(text);
  }

  paginate<T>(items: T[], page: number, limit: number) {
    const start = (page - 1) * limit;
    return {
      data: items.slice(start, start + limit),
      meta: { page, limit, total: items.length },
    };
  }
}
