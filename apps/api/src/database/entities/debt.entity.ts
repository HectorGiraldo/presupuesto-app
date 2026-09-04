import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DebtType } from '@presupuesto/shared';
import { BaseEntity } from './base.entity';
import { bigintTransformer, numericTransformer } from './transformers';
import { UserEntity } from './user.entity';

@Entity('debts')
@Index(['userId', 'archived'])
export class DebtEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: DebtType, default: DebtType.LOAN })
  type!: DebtType;

  /** Importe original del préstamo. */
  @Column({ type: 'bigint', transformer: bigintTransformer })
  principalCents!: number;

  /** Lo que queda por pagar hoy. */
  @Column({ type: 'bigint', transformer: bigintTransformer })
  currentBalanceCents!: number;

  /** TIN anual en porcentaje, ej. 3.25 */
  @Column({ type: 'numeric', precision: 6, scale: 3, default: 0, transformer: numericTransformer })
  interestRate!: number;

  @Column({ type: 'bigint', default: 0, transformer: bigintTransformer })
  monthlyPaymentCents!: number;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'int', nullable: true })
  termMonths!: number | null;

  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @OneToMany(() => DebtPaymentEntity, (p) => p.debt)
  payments?: DebtPaymentEntity[];
}

@Entity('debt_payments')
@Index(['debtId', 'date'])
export class DebtPaymentEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  debtId!: string;

  @ManyToOne(() => DebtEntity, (d) => d.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debtId' })
  debt?: DebtEntity;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amountCents!: number;

  /** Parte de la cuota que reduce la deuda. */
  @Column({ type: 'bigint', default: 0, transformer: bigintTransformer })
  principalCents!: number;

  /** Parte que se lleva el banco: es el coste real de la deuda. */
  @Column({ type: 'bigint', default: 0, transformer: bigintTransformer })
  interestCents!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
