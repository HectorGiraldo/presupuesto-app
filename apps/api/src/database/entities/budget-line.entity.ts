import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';
import { bigintTransformer } from './transformers';
import { UserEntity } from './user.entity';

@Entity('budget_lines')
// Una sola línea por categoría y periodo: evita presupuestos duplicados que
// descuadrarían todos los totales.
@Unique('UQ_budget_line_period', ['userId', 'categoryId', 'year', 'month'])
@Index(['userId', 'year', 'month'])
export class BudgetLineEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => CategoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryEntity;

  @Column({ type: 'int' })
  year!: number;

  /** null = objetivo ANUAL, para gastos estacionales (IBI, seguro del coche, vacaciones). */
  @Column({ type: 'int', nullable: true })
  month!: number | null;

  @Column({ type: 'bigint', default: 0, transformer: bigintTransformer })
  plannedCents!: number;

  /** Si sobra presupuesto este mes, sumarlo al del mes siguiente. */
  @Column({ type: 'boolean', default: false })
  rollover!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
