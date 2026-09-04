import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { bigintTransformer } from './transformers';
import { UserEntity } from './user.entity';

@Entity('goals')
@Index(['userId', 'archived'])
export class GoalEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  targetCents!: number;

  @Column({ type: 'date', nullable: true })
  targetDate!: string | null;

  /** Cuenta donde vive el dinero de la meta, si está separada. */
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @Column({ type: 'varchar', length: 20, default: '#10b981' })
  color!: string;

  @Column({ type: 'varchar', length: 40, default: 'target' })
  icon!: string;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @OneToMany(() => GoalContributionEntity, (c) => c.goal)
  contributions?: GoalContributionEntity[];
}

@Entity('goal_contributions')
@Index(['goalId', 'date'])
export class GoalContributionEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  goalId!: string;

  @ManyToOne(() => GoalEntity, (g) => g.contributions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal?: GoalEntity;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amountCents!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
