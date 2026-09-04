import { Component, OnInit, computed, inject, signal } from '@angular/core';
import type { AnnualSummary } from '@presupuesto/shared';
import { CategoryKind, MONTH_NAMES_SHORT, currentPeriod } from '@presupuesto/shared';
import { ReportsApi } from '../../core/api/reports.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { HeatCellStyle, heatColor } from '../../shared/utils/heatmap';

@Component({
  selector: 'app-annual-page',
  standalone: true,
  imports: [EurosPipe],
  templateUrl: './annual-page.component.html',
  styleUrl: './annual-page.component.scss',
})
export class AnnualPageComponent implements OnInit {
  private readonly api = inject(ReportsApi);

  readonly monthNames = MONTH_NAMES_SHORT;
  readonly CategoryKind = CategoryKind;
  readonly year = signal(currentPeriod().year);
  readonly summary = signal<AnnualSummary | null>(null);
  readonly loading = signal(true);

  readonly expenseCategories = computed(() => (this.summary()?.categories ?? []).filter((c) => c.kind === CategoryKind.EXPENSE));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.annualSummary(this.year()).subscribe({
      next: (summary) => { this.summary.set(summary); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevYear(): void {
    this.year.update((y) => y - 1);
    this.load();
  }

  nextYear(): void {
    this.year.update((y) => y + 1);
    this.load();
  }

  /** Intensidad relativa a los 12 meses de ESA categoría, para ver en qué meses se dispara. */
  cellStyle(monthlyCents: number[], value: number): HeatCellStyle {
    return heatColor(value, Math.max(...monthlyCents, 1));
  }
}
