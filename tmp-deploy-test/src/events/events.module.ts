import { Global, Module } from '@nestjs/common';

import { LibsModule } from '../libs/libs.module';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
  imports: [LibsModule],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventsModule {}
