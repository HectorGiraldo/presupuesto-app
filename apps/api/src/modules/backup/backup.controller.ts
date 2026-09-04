import { Body, Controller, Get, Post } from '@nestjs/common';
import type { BackupPayload } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly service: BackupService) {}

  @Get('export')
  export(@CurrentUser('id') userId: string): Promise<BackupPayload> {
    return this.service.export(userId);
  }

  @Post('import')
  import(@CurrentUser('id') userId: string, @Body() payload: BackupPayload) {
    return this.service.import(userId, payload);
  }
}
