import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { Goal } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateContributionDto, CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query('includeArchived') includeArchived?: string): Promise<Goal[]> {
    return this.service.findAll(userId, includeArchived === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<Goal> {
    return this.service.findOne(userId, id);
  }

  @Get(':id/contributions')
  contributions(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.listContributions(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGoalDto): Promise<Goal> {
    return this.service.create(userId, dto);
  }

  @Post(':id/contributions')
  addContribution(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContributionDto,
  ): Promise<Goal> {
    return this.service.addContribution(userId, id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ): Promise<Goal> {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
