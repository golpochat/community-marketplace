import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

import type { ApiError } from '@community-marketplace/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveHttpExceptionBody(exception: HttpException): ApiError {
  const status = exception.getStatus();
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { code: `HTTP_${status}`, message: response };
  }

  if (isRecord(response)) {
    const rawMessage = response.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage)
          ? String(rawMessage[0] ?? exception.message)
          : exception.message;

    const code =
      typeof response.code === 'string' && response.code.length > 0
        ? response.code
        : `HTTP_${status}`;

    const details = isRecord(response.details)
      ? response.details
      : undefined;

    const policyUrl =
      typeof response.policyUrl === 'string' ? response.policyUrl : undefined;

    return {
      code,
      message,
      ...(details ? { details } : {}),
      ...(policyUrl ? { policyUrl } : {}),
    };
  }

  return { code: `HTTP_${status}`, message: exception.message };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof ZodError
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

    if (
      !(exception instanceof HttpException) &&
      !(exception instanceof ZodError) &&
      process.env.NODE_ENV !== 'production'
    ) {
      console.error('[GlobalExceptionFilter]', exception);
    }

    const body: ApiError =
      exception instanceof HttpException
        ? resolveHttpExceptionBody(exception)
        : exception instanceof ZodError
          ? {
              code: 'VALIDATION_ERROR',
              message: exception.issues[0]?.message ?? 'Validation failed',
            }
          : {
              code: `HTTP_${status}`,
              message:
                exception instanceof Error
                  ? exception.message
                  : 'Internal server error',
            };

    response.status(status).json(body);
  }
}
