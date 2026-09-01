import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

import type { ApiResponse } from '@community-marketplace/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | StreamableFile | Buffer> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | StreamableFile | Buffer> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }
        return { data };
      }),
    );
  }
}
