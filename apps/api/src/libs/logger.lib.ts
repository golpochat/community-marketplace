import { Injectable } from '@nestjs/common';
import pino, { type Logger } from 'pino';

@Injectable()
export class LoggerLib {
  private readonly logger: Logger;

  constructor() {
    const level = process.env.LOG_LEVEL ?? 'info';
    this.logger = pino({
      level,
      base: { service: process.env.OTEL_SERVICE_NAME ?? 'community-marketplace-api' },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label };
        },
      },
    });
  }

  log(context: string, message: string, meta?: Record<string, unknown>) {
    this.logger.info({ context, ...meta }, message);
  }

  warn(context: string, message: string, meta?: Record<string, unknown>) {
    this.logger.warn({ context, ...meta }, message);
  }

  error(context: string, message: string, trace?: string, meta?: Record<string, unknown>) {
    this.logger.error({ context, trace, ...meta }, message);
  }

  debug(context: string, message: string, meta?: Record<string, unknown>) {
    this.logger.debug({ context, ...meta }, message);
  }

  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings);
  }
}
