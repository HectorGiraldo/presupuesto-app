import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { AccountType, TransactionType, addDays, toDateOnly } from '@presupuesto/shared';
import { AppDataSource } from '../data-source';
import { AccountEntity, CategoryEntity, TransactionEntity, UserEntity } from '../entities';
import { DEFAULT_CATEGORIES } from '../../modules/categories/default-categories';

loadEnv();

/**
 * Crea (o reutiliza) un usuario de prueba con 3 meses de movimientos ficticios,
 * para poder ver el dashboard, el presupuesto y la vista anual con datos reales
 * desde el primer día. Se ejecuta a mano con `npm run seed`; nunca en producción.
 */
async function run(): Promise<void> {
  const email = process.env.SEED_EMAIL ?? 'demo@example.com';
  const password = process.env.SEED_PASSWORD ?? 'demo12345';

  const ds = await AppDataSource.initialize();
  const users = ds.getRepository(UserEntity);
  const accountsRepo = ds.getRepository(AccountEntity);
  const categoriesRepo = ds.getRepository(CategoryEntity);
  const transactionsRepo = ds.getRepository(TransactionEntity);

  let user = await users.findOne({ where: { email } });
  if (!user) {
    user = await users.save(users.create({
      email, name: 'Usuario de prueba', passwordHash: await bcrypt.hash(password, 12),
    }));
    console.log(`Usuario creado: ${email} / ${password}`);
  } else {
    console.log(`Usuario ya existente reutilizado: ${email}`);
  }

  let categories = await categoriesRepo.find({ where: { userId: user.id } });
  if (categories.length === 0) {
    for (const group of DEFAULT_CATEGORIES) {
      for (const item of group.items) {
        const parent = await categoriesRepo.save(categoriesRepo.create({
          userId: user.id, name: item.name, kind: group.kind, color: item.color,
          icon: item.icon, essential: item.essential, parentId: null,
        }));
        for (const child of item.children ?? []) {
          await categoriesRepo.save(categoriesRepo.create({
            userId: user.id, name: child.name, kind: group.kind, color: item.color,
            icon: item.icon, essential: child.essential ?? item.essential, parentId: parent.id,
          }));
        }
      }
    }
    categories = await categoriesRepo.find({ where: { userId: user.id } });
    console.log(`${categories.length} categorías sembradas`);
  }

  let accounts = await accountsRepo.find({ where: { userId: user.id } });
  if (accounts.length === 0) {
    accounts = await accountsRepo.save([
      accountsRepo.create({
        userId: user.id, name: 'Cuenta corriente', type: AccountType.CHECKING,
        initialBalanceCents: 150_000, color: '#3b82f6', icon: 'wallet',
      }),
      accountsRepo.create({
        userId: user.id, name: 'Ahorro', type: AccountType.SAVINGS,
        initialBalanceCents: 500_000, color: '#10b981', icon: 'piggy-bank',
      }),
      accountsRepo.create({
        userId: user.id, name: 'Efectivo', type: AccountType.CASH,
        initialBalanceCents: 8_000, color: '#f59e0b', icon: 'banknote',
      }),
    ]);
    console.log(`${accounts.length} cuentas creadas`);
  }

  const existingTx = await transactionsRepo.count({ where: { userId: user.id } });
  if (existingTx > 0) {
    console.log(`Ya hay ${existingTx} movimientos; no se generan más.`);
    await ds.destroy();
    return;
  }

  const checking = accounts.find((a) => a.type === AccountType.CHECKING)!;
  const salaryCategory = categories.find((c) => c.name === 'Nómina')!;
  const byName = (name: string) => categories.find((c) => c.name === name);

  const recurringExpenses: { name: string; amountCents: number }[] = [
    { name: 'Alquiler / Hipoteca', amountCents: 75_000 },
    { name: 'Supermercado', amountCents: 32_000 },
    { name: 'Luz', amountCents: 6_500 },
    { name: 'Internet', amountCents: 3_500 },
    { name: 'Móvil', amountCents: 1_800 },
    { name: 'Transporte público', amountCents: 5_400 },
    { name: 'Gimnasio', amountCents: 3_000 },
    { name: 'Streaming', amountCents: 1_299 },
    { name: 'Restaurantes', amountCents: 12_000 },
  ];

  const rows: Partial<TransactionEntity>[] = [];
  const today = toDateOnly();
  let cursor = addDays(today, -89); // ~3 meses hacia atrás

  for (let i = 0; i < 3; i += 1) {
    const monthStart = addDays(cursor, i * 30);
    rows.push({
      userId: user.id, type: TransactionType.INCOME, accountId: checking.id,
      categoryId: salaryCategory.id, amountCents: 180_000, date: monthStart,
      description: 'Nómina', notes: null, tags: [],
    });
    for (const exp of recurringExpenses) {
      const category = byName(exp.name);
      if (!category) continue;
      rows.push({
        userId: user.id, type: TransactionType.EXPENSE, accountId: checking.id,
        categoryId: category.id, amountCents: exp.amountCents,
        date: addDays(monthStart, 2 + Math.floor(Math.random() * 20)),
        description: exp.name, notes: null, tags: [],
      });
    }
  }

  await transactionsRepo.save(rows.map((r) => transactionsRepo.create(r)));
  console.log(`${rows.length} movimientos de ejemplo generados (3 meses)`);

  await ds.destroy();
}

run().catch((err) => {
  console.error('Error al ejecutar el seed:', err);
  process.exit(1);
});
