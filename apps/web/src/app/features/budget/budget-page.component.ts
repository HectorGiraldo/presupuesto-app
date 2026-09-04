import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { BudgetProgress, Category } from '@presupuesto/shared';
import { CategoryKind, MONTH_NAMES, currentPeriod } from '@presupuesto/shared';
import { BudgetsApi } from '../../core/api/budgets.service';
import { CategoriesApi } from '../../core/api/categories.service';
import { NotificationsService } from '../../core/notifications.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { MoneyInputComponent } from '../../shared/components/money-input/money-input.component';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [ReactiveFormsModule, EurosPipe, MoneyInputComponent],
  templateUrl: './budget-page.component.html',
  styleUrl: './budget-page.component.scss',
})
export class BudgetPageComponent implements OnInit {
  private readonly api = inject(BudgetsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  readonly monthNames = MONTH_NAMES;
  readonly year = signal(currentPeriod().year);
  readonly month = signal(currentPeriod().month);
  readonly progress = signal<BudgetProgress | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);

  readonly monthLabel = computed(() => `${this.monthNames[this.month() - 1]} ${this.year()}`);

  /** Solo categorías-hoja de gasto (sin subcategorías propias), que es a lo que se puede presupuestar. */
  readonly budgetableCategories = computed(() => {
    const parentIds = new Set(this.categories().map((c) => c.parentId).filter(Boolean));
    const alreadyBudgeted = new Set((this.progress()?.lines ?? []).map((l) => l.categoryId));
    return this.categories().filter((c) =>
      c.kind === CategoryKind.EXPENSE && !c.archived && !parentIds.has(c.id) && !alreadyBudgeted.has(c.id));
  });

  readonly form = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    plannedCents: [0, [Validators.required, Validators.min(1)]],
    rollover: [false],
  });

  ngOnInit(): void {
    this.categoriesApi.findAll().subscribe((categories) => this.categories.set(categories));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.progress(this.year(), this.month()).subscribe({
      next: (progress) => { this.progress.set(progress); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevMonth(): void {
    if (this.month() === 1) { this.month.set(12); this.year.update((y) => y - 1); }
    else this.month.update((m) => m - 1);
    this.load();
  }

  nextMonth(): void {
    if (this.month() === 12) { this.month.set(1); this.year.update((y) => y + 1); }
    else this.month.update((m) => m + 1);
    this.load();
  }

  openCreate(): void {
    this.form.reset({ categoryId: '', plannedCents: 0, rollover: false });
    this.showForm.set(true);
  }

  editLine(categoryId: string, plannedCents: number): void {
    this.form.reset({ categoryId, plannedCents, rollover: false });
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
    this.api.upsert({ ...dto, year: this.year(), month: this.month() }).subscribe({
      next: () => {
        this.notifications.success('Presupuesto guardado');
        this.showForm.set(false);
        this.load();
      },
    });
  }

  copyFromPrevious(): void {
    const fromMonth = this.month() === 1 ? 12 : this.month() - 1;
    const fromYear = this.month() === 1 ? this.year() - 1 : this.year();
    if (!confirm(`¿Copiar el presupuesto de ${this.monthNames[fromMonth - 1]} a ${this.monthLabel()}?`)) return;
    this.api.copyFromPrevious({ fromYear, fromMonth, toYear: this.year(), toMonth: this.month() }).subscribe({
      next: (lines) => {
        this.notifications.success(`${lines.length} categorías copiadas`);
        this.load();
      },
    });
  }

  statusLabel(status: string): string {
    return { ok: 'Bien', warning: 'Atención', exceeded: 'Superado', unbudgeted: 'Sin presupuestar' }[status] ?? status;
  }
}
