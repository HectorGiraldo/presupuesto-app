import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RecurrenceFrequency, TransactionType } from '@presupuesto/shared';
import { AccountEntity } from './account.entity';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';
import { bigintTransformer } from './transformers';
import { UserEntity } from './user.entity';

@Entity('recurring_rules')
@Index(['userId', 'active'])
export class RecurringRuleEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account?: AccountEntity;

  @Column({ type: 'uuid', nullable: true })
  toAccountId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryEntity | null;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amountCents!: number;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'enum', enum: RecurrenceFrequency, default: RecurrenceFrequency.MONTHLY })
  frequency!: RecurrenceFrequency;

  /** Día del mes (1-31). Si el mes no tiene ese día, se usa el último. */
  @Column({ type: 'int', nullable: true })
  dayOfMonth!: number | null;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  /** true = crea el movimiento automáticamente; false = solo avisa para confirmarlo. */
  @Column({ type: 'boolean', default: true })
  autoGenerate!: boolean;

  /**
   * Última fecha prevista ya materializada. Es la clave de la idempotencia:
   * si el cron se ejecuta dos veces, la segunda no genera nada.
   */
  @Column({ type: 'date', nullable: true })
  lastGeneratedDate!: string | null;
}
