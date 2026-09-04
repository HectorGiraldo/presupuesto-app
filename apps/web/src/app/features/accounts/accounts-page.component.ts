import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Account } from '@presupuesto/shared';
import { ACCOUNT_TYPE_LABELS, AccountType } from '@presupuesto/shared';
import { AccountsApi } from '../../core/api/accounts.service';
import { NotificationsService } from '../../core/notifications.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { MoneyInputComponent } from '../../shared/components/money-input/money-input.component';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [ReactiveFormsModule, EurosPipe, MoneyInputComponent],
  templateUrl: './accounts-page.component.html',
  styleUrl: './accounts-page.component.scss',
})
export class AccountsPageComponent implements OnInit {
  private readonly api = inject(AccountsApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly accountTypes = Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: [AccountType.CHECKING, Validators.required],
    initialBalanceCents: [0],
    color: ['#3b82f6'],
    icon: ['wallet'],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.findAll().subscribe({
      next: (accounts) => { this.accounts.set(accounts); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  totalBalance(): number {
    return this.accounts().reduce((sum, a) => sum + (a.currentBalanceCents ?? 0), 0);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', type: AccountType.CHECKING, initialBalanceCents: 0, color: '#3b82f6', icon: 'wallet' });
    this.showForm.set(true);
  }

  openEdit(account: Account): void {
    this.editingId.set(account.id);
    this.form.reset({
      name: account.name, type: account.type, initialBalanceCents: account.initialBalanceCents,
      color: account.color, icon: account.icon,
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
    const dto = this.form.getRawValue();
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.notifications.success(editingId ? 'Cuenta actualizada' : 'Cuenta creada');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  remove(account: Account): void {
    if (!confirm(`¿Eliminar la cuenta "${account.name}"?`)) return;
    this.api.remove(account.id).subscribe({
      next: (result) => {
        this.notifications.success(result.archived ? 'Cuenta archivada (tiene movimientos)' : 'Cuenta eliminada');
        this.load();
      },
    });
  }
}
