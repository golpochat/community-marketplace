import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerLib {
  log(context: string, message: string) {
    console.log(`[${context}] ${message}`);
  }

  error(context: string, message: string, trace?: string) {
    console.error(`[${context}] ${message}`, trace ?? '');
  }
}
