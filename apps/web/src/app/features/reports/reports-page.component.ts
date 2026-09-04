import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CashflowPoint, Category, CategoryTrend, EssentialsSplit } from '@presupuesto/shared';
import { CategoryKind, MONTH_NAMES, addDays, currentPeriod, today } from '@presupuesto/shared';
import { CategoriesApi } from '../../core/api/categories.service';
import { ReportsApi } from '../../core/api/reports.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';

/** Colores categóricos de la paleta validada: slot 1 (azul) esencial, slot 2 (naranja)
 *  prescindible, slot 6 (verde) ahorrado — orden fijo, nunca ciclado. */
const SPLIT_COLORS = { essential: '#2a78d6', discretionary: '#eb6834', saved: '#008300' };

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [FormsModule, EurosPipe, DateOnlyPipe],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
})
export class ReportsPageComponent implements OnInit {
  private readonly api = inject(ReportsApi);
  private readonly categoriesApi = inject(CategoriesApi);

  readonly monthNames = MONTH_NAMES;
  readonly splitColors = SPLIT_COLORS;

  readonly year = signal(currentPeriod().year);
  readonly month = signal(currentPeriod().month);
  readonly split = signal<EssentialsSplit | null>(null);
  readonly loadingSplit = signal(true);

  readonly categories = signal<Category[]>([]);
  readonly selectedCategoryId = signal<string>('');
  readonly trend = signal<CategoryTrend | null>(null);
  readonly loadingTrend = signal(false);

  readonly cashflowFrom = signal(addDays(today(), -89));
  readonly cashflowTo = signal(today());
  readonly cashflow = signal<CashflowPoint[]>([]);
  readonly loadingCashflow = signal(true);

  readonly expenseCategories = computed(() => this.categories().filter((c) => c.kind === CategoryKind.EXPENSE));

  readonly splitSegments = computed(() => {
    const s = this.split();
    if (!s || s.incomeCents <= 0) return [];
    return [
      { label: 'Esencial', percent: Math.max(0, s.essentialPercent), color: SPLIT_COLORS.essential, amount: s.essentialCents },
      { label: 'Prescindible', percent: Math.max(0, s.discretionaryPercent), color: SPLIT_COLORS.discretionary, amount: s.discretionaryCents },
      { label: 'Ahorrado', percent: Math.max(0, s.savedPercent), color: SPLIT_COLORS.saved, amount: s.savedCents },
    ].filter((seg) => seg.percent > 0);
  });

  ngOnInit(): void {
    this.categoriesApi.findAll().subscribe((categories) => this.categories.set(categories));
    this.loadSplit();
    this.loadCashflow();
  }

  loadSplit(): void {
    this.loadingSplit.set(true);
    this.api.essentialsSplit(this.year(), this.month()).subscribe({
      next: (split) => { this.split.set(split); this.loadingSplit.set(false); },
      error: () => this.loadingSplit.set(false),
    });
  }

  prevMonth(): void {
    if (this.month() === 1) { this.month.set(12); this.year.update((y) => y - 1); }
    else this.month.update((m) => m - 1);
    this.loadSplit();
  }

  nextMonth(): void {
    if (this.month() === 12) { this.month.set(1); this.year.update((y) => y + 1); }
    else this.month.update((m) => m + 1);
    this.loadSplit();
  }

  onCategoryChange(): void {
    const id = this.selectedCategoryId();
    if (!id) { this.trend.set(null); return; }
    this.loadingTrend.set(true);
    this.api.categoryTrend(id, 12).subscribe({
      next: (trend) => { this.trend.set(trend); this.loadingTrend.set(false); },
      error: () => this.loadingTrend.set(false),
    });
  }

  loadCashflow(): void {
    this.loadingCashflow.set(true);
    this.api.cashflow(this.cashflowFrom(), this.cashflowTo()).subscribe({
      next: (points) => { this.cashflow.set(points); this.loadingCashflow.set(false); },
      error: () => this.loadingCashflow.set(false),
    });
  }

  trendLabel(trend: string): string {
    return { up: '▲ En aumento', down: '▼ En descenso', stable: '→ Estable' }[trend] ?? trend;
  }
}
