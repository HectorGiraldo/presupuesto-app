import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AccountType } from '@presupuesto/shared';
import { BaseEntity } from './base.entity';
import { bigintTransformer } from './transformers';
import { UserEntity } from './user.entity';

@Entity('accounts')
@Index(['userId', 'archived'])
export class AccountEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.CHECKING })
  type!: AccountType;

  /** Saldo con el que arranca la cuenta, en céntimos. El saldo actual se calcula, no se guarda. */
  @Column({ type: 'bigint', default: 0, transformer: bigintTransformer })
  initialBalanceCents!: number;

  @Column({ type: 'varchar', length: 20, default: '#3b82f6' })
  color!: string;

  @Column({ type: 'varchar', length: 40, default: 'wallet' })
  icon!: string;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;
}
