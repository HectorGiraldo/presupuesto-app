import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Account, AmortizationSchedule, Debt, DebtPayment } from '@presupuesto/shared';
import { DEBT_TYPE_LABELS, DebtType, today } from '@presupuesto/shared';
import { AccountsApi } from '../../core/api/accounts.service';
import { DebtsApi } from '../../core/api/debts.service';
import { NotificationsService } from '../../core/notifications.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';
import { MoneyInputComponent } from '../../shared/components/money-input/money-input.component';

@Component({
  selector: 'app-debts-page',
  standalone: true,
  imports: [ReactiveFormsModule, EurosPipe, DateOnlyPipe, MoneyInputComponent],
  templateUrl: './debts-page.component.html',
  styleUrl: './debts-page.component.scss',
})
export class DebtsPageComponent implements OnInit {
  private readonly api = inject(DebtsApi);
  private readonly accountsApi = inject(AccountsApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly debtTypes = Object.entries(DEBT_TYPE_LABELS) as [DebtType, string][];
  readonly debts = signal<Debt[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly payingId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);
  readonly schedule = signal<AmortizationSchedule | null>(null);
  readonly historyId = signal<string | null>(null);
  readonly paymentHistory = signal<DebtPayment[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: [DebtType.LOAN, Validators.required],
    principalCents: [0, [Validators.required, Validators.min(1)]],
    interestRate: [0, [Validators.required, Validators.min(0)]],
    monthlyPaymentCents: [0, [Validators.required, Validators.min(0)]],
    startDate: [today(), Validators.required],
    termMonths: [null as number | null],
    accountId: [''],
  });

  readonly paymentForm = this.fb.nonNullable.group({
    amountCents: [0, [Validators.required, Validators.min(1)]],
    date: [today(), Validators.required],
  });

  ngOnInit(): void {
    this.accountsApi.findAll().subscribe((accounts) => this.accounts.set(accounts));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.findAll().subscribe({
      next: (debts) => { this.debts.set(debts); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  accountName(id: string | null): string | null {
    if (!id) return null;
    return this.accounts().find((a) => a.id === id)?.name ?? null;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '', type: DebtType.LOAN, principalCents: 0, interestRate: 0,
      monthlyPaymentCents: 0, startDate: today(), termMonths: null, accountId: '',
    });
    this.showForm.set(true);
  }

  openEdit(debt: Debt): void {
    this.editingId.set(debt.id);
    this.form.reset({
      name: debt.name, type: debt.type, principalCents: debt.principalCents,
      interestRate: debt.interestRate, monthlyPaymentCents: debt.monthlyPaymentCents,
      startDate: debt.startDate, termMonths: debt.termMonths, accountId: debt.accountId ?? '',
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
    const dto = { ...raw, accountId: raw.accountId || null };
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.notifications.success(editingId ? 'Deuda actualizada' : 'Deuda creada');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  openPay(debt: Debt): void {
    this.payingId.set(debt.id);
    this.paymentForm.reset({ amountCents: debt.monthlyPaymentCents, date: today() });
  }

  cancelPay(): void {
    this.payingId.set(null);
  }

  submitPayment(debt: Debt): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    this.api.addPayment(debt.id, this.paymentForm.getRawValue()).subscribe({
      next: () => {
        this.notifications.success(
          debt.accountId
            ? 'Pago registrado y descontado de la cuenta'
            : 'Pago registrado (sin cuenta de cargo, no afecta a ningún saldo)',
        );
        this.payingId.set(null);
        if (this.historyId() === debt.id) this.loadHistory(debt.id);
        this.load();
      },
    });
  }

  toggleSchedule(debt: Debt): void {
    if (this.expandedId() === debt.id) {
      this.expandedId.set(null);
      this.schedule.set(null);
      return;
    }
    this.expandedId.set(debt.id);
    this.api.amortization(debt.id).subscribe((schedule) => this.schedule.set(schedule));
  }

  toggleHistory(debt: Debt): void {
    if (this.historyId() === debt.id) {
      this.historyId.set(null);
      this.paymentHistory.set([]);
      return;
    }
    this.historyId.set(debt.id);
    this.loadHistory(debt.id);
  }

  private loadHistory(debtId: string): void {
    this.api.payments(debtId).subscribe((payments) => this.paymentHistory.set(payments));
  }

  remove(debt: Debt): void {
    if (!confirm(`¿Eliminar la deuda "${debt.name}"?`)) return;
    this.api.remove(debt.id).subscribe({
      next: () => { this.notifications.success('Deuda eliminada'); this.load(); },
    });
  }
}
