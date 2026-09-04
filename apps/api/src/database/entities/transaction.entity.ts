import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TransactionType } from '@presupuesto/shared';
import { AccountEntity } from './account.entity';
import { BaseEntity } from './base.entity';
import { CategoryEntity } from './category.entity';
import { bigintTransformer } from './transformers';
import { UserEntity } from './user.entity';

@Entity('transactions')
// Índices pensados para las tres consultas calientes: listado por fecha,
// agregados de presupuesto por categoría y saldo por cuenta.
@Index(['userId', 'date'])
@Index(['userId', 'categoryId', 'date'])
@Index(['userId', 'accountId', 'date'])
export class TransactionEntity extends BaseEntity {
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

  /** Solo en traspasos: cuenta de destino. */
  @Column({ type: 'uuid', nullable: true })
  toAccountId!: string | null;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'toAccountId' })
  toAccount?: AccountEntity | null;

  /** null en traspasos: mover dinero entre cuentas propias no es un gasto. */
  @Column({ type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryEntity | null;

  /** SIEMPRE positivo. El signo lo determina `type`. */
  @Column({ type: 'bigint', transformer: bigintTransformer })
  amountCents!: number;

  /**
   * Solo fecha, sin hora ni zona. Con `timestamptz` un gasto del día 1 de madrugada
   * caería en el mes anterior al convertirse a UTC.
   */
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  /** Si la generó una regla recurrente, para poder rastrearla y evitar duplicados. */
  @Column({ type: 'uuid', nullable: true })
  recurringRuleId!: string | null;
}
