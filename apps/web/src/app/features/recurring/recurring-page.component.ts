import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Account, Category, RecurringRule } from '@presupuesto/shared';
import { FREQUENCY_LABELS, RecurrenceFrequency, TransactionType, today } from '@presupuesto/shared';
import { AccountsApi } from '../../core/api/accounts.service';
import { CategoriesApi } from '../../core/api/categories.service';
import { RecurringApi } from '../../core/api/recurring.service';
import { NotificationsService } from '../../core/notifications.service';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { MoneyInputComponent } from '../../shared/components/money-input/money-input.component';

@Component({
  selector: 'app-recurring-page',
  standalone: true,
  imports: [ReactiveFormsModule, EurosPipe, DateOnlyPipe, MoneyInputComponent],
  templateUrl: './recurring-page.component.html',
  styleUrl: './recurring-page.component.scss',
})
export class RecurringPageComponent implements OnInit {
  private readonly api = inject(RecurringApi);
  private readonly accountsApi = inject(AccountsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly TransactionType = TransactionType;
  readonly frequencyLabels = FREQUENCY_LABELS;
  readonly frequencies = Object.entries(FREQUENCY_LABELS) as [RecurrenceFrequency, string][];

  readonly rules = signal<RecurringRule[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    type: [TransactionType.EXPENSE, Validators.required],
    accountId: ['', Validators.required],
    toAccountId: [''],
    categoryId: [''],
    amountCents: [0, [Validators.required, Validators.min(1)]],
    description: ['', Validators.required],
    frequency: [RecurrenceFrequency.MONTHLY, Validators.required],
    dayOfMonth: [1],
    startDate: [today(), Validators.required],
    endDate: [''],
    autoGenerate: [true],
  });

  private readonly formType = toSignal(this.form.controls.type.valueChanges, { initialValue: this.form.controls.type.value });
  private readonly formFrequency = toSignal(this.form.controls.frequency.valueChanges, { initialValue: this.form.controls.frequency.value });

  readonly categoryOptions = computed(() => {
    const kind = this.formType() === TransactionType.INCOME ? 'INCOME' : 'EXPENSE';
    return this.categories().filter((c) => c.kind === kind && !c.archived);
  });
  readonly isTransfer = computed(() => this.formType() === TransactionType.TRANSFER);
  readonly showDayOfMonth = computed(() =>
    [RecurrenceFrequency.MONTHLY, RecurrenceFrequency.QUARTERLY, RecurrenceFrequency.YEARLY].includes(this.formFrequency()));

  ngOnInit(): void {
    this.accountsApi.findAll().subscribe((accounts) => this.accounts.set(accounts));
    this.categoriesApi.findAll().subscribe((categories) => this.categories.set(categories));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.findAll(true).subscribe({
      next: (rules) => { this.rules.set(rules); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      type: TransactionType.EXPENSE, accountId: this.accounts()[0]?.id ?? '', toAccountId: '',
      categoryId: '', amountCents: 0, description: '', frequency: RecurrenceFrequency.MONTHLY,
      dayOfMonth: 1, startDate: today(), endDate: '', autoGenerate: true,
    });
    this.showForm.set(true);
  }

  openEdit(rule: RecurringRule): void {
    this.editingId.set(rule.id);
    this.form.reset({
      type: rule.type, accountId: rule.accountId, toAccountId: rule.toAccountId ?? '',
      categoryId: rule.categoryId ?? '', amountCents: rule.amountCents, description: rule.description,
      frequency: rule.frequency, dayOfMonth: rule.dayOfMonth ?? 1, startDate: rule.startDate,
      endDate: rule.endDate ?? '', autoGenerate: rule.autoGenerate,
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
      ...raw,
      categoryId: raw.type === TransactionType.TRANSFER ? null : (raw.categoryId || null),
      toAccountId: raw.type === TransactionType.TRANSFER ? raw.toAccountId || null : null,
      dayOfMonth: this.showDayOfMonth() ? raw.dayOfMonth : null,
      endDate: raw.endDate || null,
    };
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.notifications.success(editingId ? 'Regla actualizada' : 'Regla creada');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  toggleActive(rule: RecurringRule): void {
    this.api.update(rule.id, { active: !rule.active }).subscribe({ next: () => this.load() });
  }

  generateNow(rule: RecurringRule): void {
    this.api.generate(rule.id).subscribe({
      next: (result) => {
        this.notifications.success(result.generated > 0 ? `${result.generated} movimiento(s) generado(s)` : 'No hay nada pendiente');
        this.load();
      },
    });
  }

  remove(rule: RecurringRule): void {
    if (!confirm(`¿Eliminar la regla "${rule.description}"?`)) return;
    this.api.remove(rule.id).subscribe({
      next: () => { this.notifications.success('Regla eliminada'); this.load(); },
    });
  }
}
