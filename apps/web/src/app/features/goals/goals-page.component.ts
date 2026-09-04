import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Account, Goal } from '@presupuesto/shared';
import { today } from '@presupuesto/shared';
import { AccountsApi } from '../../core/api/accounts.service';
import { GoalsApi } from '../../core/api/goals.service';
import { NotificationsService } from '../../core/notifications.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';
import { MoneyInputComponent } from '../../shared/components/money-input/money-input.component';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [ReactiveFormsModule, EurosPipe, DateOnlyPipe, MoneyInputComponent],
  templateUrl: './goals-page.component.html',
  styleUrl: './goals-page.component.scss',
})
export class GoalsPageComponent implements OnInit {
  private readonly api = inject(GoalsApi);
  private readonly accountsApi = inject(AccountsApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly goals = signal<Goal[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly contributingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    targetCents: [0, [Validators.required, Validators.min(1)]],
    targetDate: [''],
    accountId: [''],
    color: ['#10b981'],
  });

  readonly contributionForm = this.fb.nonNullable.group({
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
      next: (goals) => { this.goals.set(goals); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', targetCents: 0, targetDate: '', accountId: '', color: '#10b981' });
    this.showForm.set(true);
  }

  openEdit(goal: Goal): void {
    this.editingId.set(goal.id);
    this.form.reset({
      name: goal.name, targetCents: goal.targetCents, targetDate: goal.targetDate ?? '',
      accountId: goal.accountId ?? '', color: goal.color,
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
    const dto = { ...raw, targetDate: raw.targetDate || null, accountId: raw.accountId || null };
    const editingId = this.editingId();
    const request = editingId ? this.api.update(editingId, dto) : this.api.create(dto);
    request.subscribe({
      next: () => {
        this.notifications.success(editingId ? 'Meta actualizada' : 'Meta creada');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  openContribute(goal: Goal): void {
    this.contributingId.set(goal.id);
    this.contributionForm.reset({ amountCents: 0, date: today() });
  }

  cancelContribute(): void {
    this.contributingId.set(null);
  }

  submitContribution(): void {
    const goalId = this.contributingId();
    if (!goalId || this.contributionForm.invalid) {
      this.contributionForm.markAllAsTouched();
      return;
    }
    this.api.addContribution(goalId, this.contributionForm.getRawValue()).subscribe({
      next: () => {
        this.notifications.success('Aportación registrada');
        this.contributingId.set(null);
        this.load();
      },
    });
  }

  remove(goal: Goal): void {
    if (!confirm(`¿Eliminar la meta "${goal.name}"?`)) return;
    this.api.remove(goal.id).subscribe({
      next: () => { this.notifications.success('Meta eliminada'); this.load(); },
    });
  }
}
