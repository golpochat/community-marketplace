import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { DevUploadController } from './dev-upload.controller';
import { DevUploadService } from './dev-upload.service';

@Module({
  imports: [UsersModule],
  controllers: [DevUploadController],
  providers: [DevUploadService],
})
export class DevUploadModule {}
