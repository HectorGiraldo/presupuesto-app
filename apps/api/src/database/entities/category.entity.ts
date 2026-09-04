import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CategoryKind } from '@presupuesto/shared';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('categories')
@Index(['userId', 'kind', 'archived'])
export class CategoryEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: CategoryKind })
  kind!: CategoryKind;

  /** Permite subcategorías: Alimentación -> Supermercado / Restaurantes. */
  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => CategoryEntity, (c) => c.children, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: CategoryEntity | null;

  @OneToMany(() => CategoryEntity, (c) => c.parent)
  children?: CategoryEntity[];

  @Column({ type: 'varchar', length: 20, default: '#64748b' })
  color!: string;

  @Column({ type: 'varchar', length: 40, default: 'tag' })
  icon!: string;

  /**
   * Gasto imprescindible (vivienda, luz, comida) frente a prescindible (ocio, caprichos).
   * Es el flag que hace posible el análisis 50/30/20 y ver de un vistazo cuánto gasto
   * es realmente recortable.
   */
  @Column({ type: 'boolean', default: false })
  essential!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;
}
