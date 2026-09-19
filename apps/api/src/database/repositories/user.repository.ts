import { Injectable } from '@nestjs/common';

import { userProfileInclude } from '../../modules/users/mappers/user.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdWithRole(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { primaryRole: true },
    });
  }

  findByIdWithProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userProfileInclude,
    });
  }
}
