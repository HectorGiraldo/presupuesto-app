import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  AccountEntity, BudgetLineEntity, CategoryEntity, DebtEntity, DebtPaymentEntity,
  GoalContributionEntity, GoalEntity, RecurringRuleEntity, TransactionEntity, UserEntity,
} from './entities';

loadEnv();

/** Se listan explícitamente en vez de usar globs: así funciona igual en ts-node, en dist y en Docker. */
export const entities = [
  UserEntity, AccountEntity, CategoryEntity, TransactionEntity, BudgetLineEntity,
  RecurringRuleEntity, GoalEntity, GoalContributionEntity, DebtEntity, DebtPaymentEntity,
];

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ?? '5432';
  const user = process.env.DB_USER ?? 'presupuesto';
  const pass = process.env.DB_PASSWORD ?? 'presupuesto';
  const name = process.env.DB_NAME ?? 'presupuesto';
  return `postgres://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`;
}

/** Usado por la CLI de TypeORM para generar y ejecutar migraciones. */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl(),
  entities,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  // Nunca `true`: en una app de finanzas, dejar que el ORM altere el esquema solo
  // es la vía rápida a perder datos. Todo cambio pasa por una migración.
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
