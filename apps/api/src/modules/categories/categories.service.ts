import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryKind } from '@presupuesto/shared';
import { IsNull, Repository } from 'typeorm';
import { CategoryEntity, TransactionEntity } from '../../database/entities';
import { DEFAULT_CATEGORIES } from './default-categories';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
  ) {}

  async findAll(userId: string, includeArchived = false): Promise<CategoryEntity[]> {
    const where = includeArchived ? { userId } : { userId, archived: false };
    return this.repo.find({ where, order: { kind: 'ASC', name: 'ASC' } });
  }

  /** Devuelve el árbol padre -> hijos, que es como se pinta en los selectores. */
  async findTree(userId: string, includeArchived = false): Promise<CategoryEntity[]> {
    const all = await this.findAll(userId, includeArchived);
    const byId = new Map(all.map((c) => [c.id, { ...c, children: [] as CategoryEntity[] }]));
    const roots: CategoryEntity[] = [];
    for (const cat of byId.values()) {
      if (cat.parentId && byId.has(cat.parentId)) {
        byId.get(cat.parentId)!.children!.push(cat);
      } else {
        roots.push(cat);
      }
    }
    return roots;
  }

  async findOne(userId: string, id: string): Promise<CategoryEntity> {
    const category = await this.repo.findOne({ where: { id, userId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryEntity> {
    if (dto.parentId) {
      const parent = await this.findOne(userId, dto.parentId);
      if (parent.kind !== dto.kind) {
        throw new BadRequestException('La subcategoría debe ser del mismo tipo que su categoría padre');
      }
      if (parent.parentId) {
        throw new BadRequestException('Solo se admite un nivel de subcategorías');
      }
    }
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findOne(userId, id);
    if (dto.parentId === id) {
      throw new BadRequestException('Una categoría no puede ser su propia categoría padre');
    }
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  /**
   * Borrar una categoría con movimientos dejaría gastos huérfanos y descuadraría el
   * histórico, así que en ese caso se archiva: desaparece de los selectores pero
   * los reportes pasados siguen siendo correctos.
   */
  async remove(userId: string, id: string): Promise<{ deleted: boolean; archived: boolean }> {
    const category = await this.findOne(userId, id);
    const used = await this.transactions.count({ where: { userId, categoryId: id } });
    const hasChildren = await this.repo.count({ where: { userId, parentId: id } });

    if (used > 0 || hasChildren > 0) {
      category.archived = true;
      await this.repo.save(category);
      return { deleted: false, archived: true };
    }

    await this.repo.remove(category);
    return { deleted: true, archived: false };
  }

  /** Siembra el catálogo español por defecto. Idempotente: no duplica lo que ya existe. */
  async seedDefaults(userId: string): Promise<CategoryEntity[]> {
    const existing = await this.repo.find({ where: { userId } });
    const existingNames = new Set(existing.map((c) => `${c.kind}:${c.name.toLowerCase()}`));
    const created: CategoryEntity[] = [];

    for (const group of DEFAULT_CATEGORIES) {
      for (const item of group.items) {
        const key = `${group.kind}:${item.name.toLowerCase()}`;
        let parent = existing.find((c) => `${c.kind}:${c.name.toLowerCase()}` === key) ?? null;

        if (!parent) {
          parent = await this.repo.save(this.repo.create({
            userId, name: item.name, kind: group.kind, color: item.color,
            icon: item.icon, essential: item.essential, parentId: null,
          }));
          created.push(parent);
          existingNames.add(key);
        }

        for (const child of item.children ?? []) {
          const childKey = `${group.kind}:${child.name.toLowerCase()}`;
          if (existingNames.has(childKey)) continue;
          const saved = await this.repo.save(this.repo.create({
            userId, name: child.name, kind: group.kind, color: item.color,
            icon: item.icon, essential: child.essential ?? item.essential, parentId: parent.id,
          }));
          created.push(saved);
          existingNames.add(childKey);
        }
      }
    }

    return created;
  }

  /** Se usa al validar movimientos: la categoría debe existir y encajar con el tipo. */
  async assertBelongsTo(userId: string, categoryId: string, kind?: CategoryKind): Promise<CategoryEntity> {
    const category = await this.findOne(userId, categoryId);
    if (kind && category.kind !== kind) {
      throw new BadRequestException(
        `La categoría "${category.name}" es de ${category.kind === CategoryKind.INCOME ? 'ingresos' : 'gastos'} y no encaja con este movimiento`,
      );
    }
    return category;
  }
}
