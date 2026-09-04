import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { Category } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('tree') tree?: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<Category[]> {
    const archived = includeArchived === 'true';
    return (tree === 'true' ? this.service.findTree(userId, archived) : this.service.findAll(userId, archived)) as Promise<Category[]>;
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCategoryDto): Promise<Category> {
    return this.service.create(userId, dto) as Promise<Category>;
  }

  @Post('seed')
  seed(@CurrentUser('id') userId: string): Promise<Category[]> {
    return this.service.seedDefaults(userId) as Promise<Category[]>;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.service.update(userId, id, dto) as Promise<Category>;
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
