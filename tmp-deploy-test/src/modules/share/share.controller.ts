import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Public()
  @Post('shorten')
  shorten(@Body() body: unknown) {
    return this.shareService.shorten(body);
  }

  @Public()
  @Post('track')
  track(@Body() body: unknown) {
    return this.shareService.track(body);
  }

  @Public()
  @Get('resolve/:shortCode')
  resolve(@Param('shortCode') shortCode: string) {
    return this.shareService.resolveAndClick(shortCode);
  }
}
