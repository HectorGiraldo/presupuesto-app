import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial completo: usuarios, cuentas, categorías, movimientos, presupuesto,
 * recurrentes, metas y deudas. Todo en una sola migración porque es el arranque
 * del proyecto; a partir de aquí cada cambio de esquema será una migración propia.
 */
export class InitialSchema1757000000000 implements MigrationInterface {
  name = 'InitialSchema1757000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "name" varchar(120) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'EUR',
        "locale" varchar(10) NOT NULL DEFAULT 'es-ES'
      );
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email");
    `);

    await queryRunner.query(`
      CREATE TYPE "account_type_enum" AS ENUM ('CHECKING','SAVINGS','CASH','CREDIT_CARD','INVESTMENT');
      CREATE TABLE "accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "type" "account_type_enum" NOT NULL DEFAULT 'CHECKING',
        "initialBalanceCents" bigint NOT NULL DEFAULT 0,
        "color" varchar(20) NOT NULL DEFAULT '#3b82f6',
        "icon" varchar(40) NOT NULL DEFAULT 'wallet',
        "archived" boolean NOT NULL DEFAULT false
      );
      CREATE INDEX "IDX_accounts_user_archived" ON "accounts" ("userId", "archived");
    `);

    await queryRunner.query(`
      CREATE TYPE "category_kind_enum" AS ENUM ('INCOME','EXPENSE');
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "kind" "category_kind_enum" NOT NULL,
        "parentId" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
        "color" varchar(20) NOT NULL DEFAULT '#64748b',
        "icon" varchar(40) NOT NULL DEFAULT 'tag',
        "essential" boolean NOT NULL DEFAULT false,
        "archived" boolean NOT NULL DEFAULT false
      );
      CREATE INDEX "IDX_categories_user_kind_archived" ON "categories" ("userId", "kind", "archived");
    `);

    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM ('INCOME','EXPENSE','TRANSFER');
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" "transaction_type_enum" NOT NULL,
        "accountId" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
        "toAccountId" uuid REFERENCES "accounts"("id") ON DELETE CASCADE,
        "categoryId" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
        "amountCents" bigint NOT NULL,
        "date" date NOT NULL,
        "description" varchar(255) NOT NULL,
        "notes" text,
        "tags" text[] NOT NULL DEFAULT '{}',
        "recurringRuleId" uuid
      );
      CREATE INDEX "IDX_transactions_user_date" ON "transactions" ("userId", "date");
      CREATE INDEX "IDX_transactions_user_category_date" ON "transactions" ("userId", "categoryId", "date");
      CREATE INDEX "IDX_transactions_user_account_date" ON "transactions" ("userId", "accountId", "date");
    `);

    await queryRunner.query(`
      CREATE TABLE "budget_lines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        "year" int NOT NULL,
        "month" int,
        "plannedCents" bigint NOT NULL DEFAULT 0,
        "rollover" boolean NOT NULL DEFAULT false,
        "notes" text
      );
      CREATE UNIQUE INDEX "UQ_budget_line_period" ON "budget_lines" ("userId", "categoryId", "year", "month");
      CREATE INDEX "IDX_budget_lines_user_period" ON "budget_lines" ("userId", "year", "month");
    `);

    await queryRunner.query(`
      CREATE TYPE "recurrence_frequency_enum" AS ENUM ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','YEARLY');
      CREATE TABLE "recurring_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" "transaction_type_enum" NOT NULL,
        "accountId" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
        "toAccountId" uuid,
        "categoryId" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
        "amountCents" bigint NOT NULL,
        "description" varchar(255) NOT NULL,
        "frequency" "recurrence_frequency_enum" NOT NULL DEFAULT 'MONTHLY',
        "dayOfMonth" int,
        "startDate" date NOT NULL,
        "endDate" date,
        "active" boolean NOT NULL DEFAULT true,
        "autoGenerate" boolean NOT NULL DEFAULT true,
        "lastGeneratedDate" date
      );
      CREATE INDEX "IDX_recurring_rules_user_active" ON "recurring_rules" ("userId", "active");
    `);

    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "targetCents" bigint NOT NULL,
        "targetDate" date,
        "accountId" uuid,
        "color" varchar(20) NOT NULL DEFAULT '#10b981',
        "icon" varchar(40) NOT NULL DEFAULT 'target',
        "archived" boolean NOT NULL DEFAULT false
      );
      CREATE INDEX "IDX_goals_user_archived" ON "goals" ("userId", "archived");

      CREATE TABLE "goal_contributions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "goalId" uuid NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
        "amountCents" bigint NOT NULL,
        "date" date NOT NULL,
        "notes" text
      );
      CREATE INDEX "IDX_goal_contributions_goal_date" ON "goal_contributions" ("goalId", "date");
    `);

    await queryRunner.query(`
      CREATE TYPE "debt_type_enum" AS ENUM ('MORTGAGE','LOAN','CREDIT_CARD','PERSONAL');
      CREATE TABLE "debts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "type" "debt_type_enum" NOT NULL DEFAULT 'LOAN',
        "principalCents" bigint NOT NULL,
        "currentBalanceCents" bigint NOT NULL,
        "interestRate" numeric(6,3) NOT NULL DEFAULT 0,
        "monthlyPaymentCents" bigint NOT NULL DEFAULT 0,
        "startDate" date NOT NULL,
        "termMonths" int,
        "accountId" uuid,
        "archived" boolean NOT NULL DEFAULT false
      );
      CREATE INDEX "IDX_debts_user_archived" ON "debts" ("userId", "archived");

      CREATE TABLE "debt_payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "debtId" uuid NOT NULL REFERENCES "debts"("id") ON DELETE CASCADE,
        "amountCents" bigint NOT NULL,
        "principalCents" bigint NOT NULL DEFAULT 0,
        "interestCents" bigint NOT NULL DEFAULT 0,
        "date" date NOT NULL,
        "notes" text
      );
      CREATE INDEX "IDX_debt_payments_debt_date" ON "debt_payments" ("debtId", "date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "debt_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "debts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "debt_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "goal_contributions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "goals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recurring_rules"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "recurrence_frequency_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "category_kind_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
