import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

import type { ApiError } from '@community-marketplace/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    if (!(exception instanceof HttpException) && process.env.NODE_ENV !== 'production') {
      console.error('[GlobalExceptionFilter]', exception);
    }

    const body: ApiError = {
      code: `HTTP_${status}`,
      message,
    };

    response.status(status).json(body);
  }
}
