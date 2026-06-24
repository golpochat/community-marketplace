import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from './users.service';

/** Public user lookup — profile mutations live under /buyer/profile and /seller/profile */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id) ?? null;
  }
}
