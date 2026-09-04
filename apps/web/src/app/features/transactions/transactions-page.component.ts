import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Account, Category, Transaction, TransactionList } from '@presupuesto/shared';
import { TRANSACTION_TYPE_LABELS, TransactionType, today } from '@presupuesto/shared';
import { AccountsApi } from '../../core/api/accounts.service';
import { CategoriesApi } from '../../core/api/categories.service';
import { TransactionsApi } from '../../core/api/transactions.service';
import { NotificationsService } from '../../core/notifications.service';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { MoneyInputComponent } from '../../shared/components/money-input/money-input.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [ReactiveFormsModule, EurosPipe, DateOnlyPipe, MoneyInputComponent, KeyValuePipe],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss',
})
export class TransactionsPageComponent implements OnInit {
  private readonly api = inject(TransactionsApi);
  private readonly accountsApi = inject(AccountsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly TransactionType = TransactionType;
  readonly typeLabels = TRANSACTION_TYPE_LABELS;

  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly list = signal<TransactionList | null>(null);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly page = signal(1);

  readonly filters = this.fb.nonNullable.group({
    from: [''],
    to: [''],
    accountId: [''],
    categoryId: [''],
    type: [''],
    search: [''],
  });

  readonly form = this.fb.nonNullable.group({
    type: [TransactionType.EXPENSE, Validators.required],
    accountId: ['', Validators.required],
    toAccountId: [''],
    categoryId: [''],
    amountCents: [0, [Validators.required, Validators.min(1)]],
    date: [today(), Validators.required],
    description: ['', Validators.required],
    notes: [''],
  });

  private readonly formType = toSignal(this.form.controls.type.valueChanges, { initialValue: this.form.controls.type.value });

  readonly categoryOptions = computed(() => {
    const kind = this.formType() === TransactionType.INCOME ? 'INCOME' : 'EXPENSE';
    return this.categories().filter((c) => c.kind === kind && !c.archived);
  });

  readonly isTransfer = computed(() => this.formType() === TransactionType.TRANSFER);

  ngOnInit(): void {
    this.accountsApi.findAll().subscribe((accounts) => this.accounts.set(accounts));
    this.categoriesApi.findAll().subscribe((categories) => this.categories.set(categories));
    this.load();
  }

  accountName(id: string): string {
    return this.accounts().find((a) => a.id === id)?.name ?? '';
  }

  load(): void {
    this.loading.set(true);
    const raw = this.filters.getRawValue();
    this.api.findAll({
      from: raw.from || undefined,
      to: raw.to || undefined,
      accountId: raw.accountId || undefined,
      categoryId: raw.categoryId || undefined,
      type: (raw.type || undefined) as TransactionType | undefined,
      search: raw.search || undefined,
      page: this.page(),
      pageSize: PAGE_SIZE,
    }).subscribe({
      next: (result) => { this.list.set(result); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filters.reset({ from: '', to: '', accountId: '', categoryId: '', type: '', search: '' });
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      type: TransactionType.EXPENSE, accountId: this.accounts()[0]?.id ?? '', toAccountId: '',
      categoryId: '', amountCents: 0, date: today(), description: '', notes: '',
    });
    this.showForm.set(true);
  }

  openEdit(tx: Transaction): void {
    this.editingId.set(tx.id);
    this.form.reset({
      type: tx.type, accountId: tx.accountId, toAccountId: tx.toAccountId ?? '',
      categoryId: tx.categoryId ?? '', amountCents: tx.amountCents, date: tx.date,
      description: tx.description, notes: tx.notes ?? '',
    });
    this.showForm.set(true);
  }

  duplicate(tx: Transaction): void {
    this.editingId.set(null);
    this.form.reset({
      type: tx.type, accountId: tx.accountId, toAccountId: tx.toAccountId ?? '',
      categoryId: tx.categoryId ?? '', amountCents: tx.amountCents, date: today(),
      description: tx.description, notes: tx.notes ?? '',
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const dto = {
      type: raw.type,
      accountId: raw.accountId,
      amountCents: raw.amountCents,
      date: raw.date,
      description: raw.description,
      notes: raw.notes || null,
      categoryId: raw.type === TransactionType.TRANSFER ? null : (raw.categoryId || null),
      toAccountId: raw.type === TransactionType.TRANSFER ? raw.toAccountId || null : null,
    };
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.notifications.success(editingId ? 'Movimiento actualizado' : 'Movimiento guardado');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  remove(tx: Transaction): void {
    if (!confirm(`¿Eliminar el movimiento "${tx.description}"?`)) return;
    this.api.remove(tx.id).subscribe({
      next: () => {
        this.notifications.success('Movimiento eliminado');
        this.load();
      },
    });
  }
}
