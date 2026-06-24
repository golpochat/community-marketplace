import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch {
      // Database may be unavailable during local scaffold; RBAC falls back to role defaults
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
