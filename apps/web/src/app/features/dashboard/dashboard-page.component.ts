import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DashboardSummary } from '@presupuesto/shared';
import { MONTH_NAMES, currentPeriod } from '@presupuesto/shared';
import { DashboardApi } from '../../core/api/reports.service';
import { RecurringApi } from '../../core/api/recurring.service';
import { NotificationsService } from '../../core/notifications.service';
import { EurosPipe } from '../../shared/pipes/euros.pipe';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, EurosPipe, DateOnlyPipe],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(DashboardApi);
  private readonly recurringApi = inject(RecurringApi);
  private readonly notifications = inject(NotificationsService);

  readonly monthName = MONTH_NAMES[currentPeriod().month - 1];
  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.summary().subscribe({
      next: (summary) => { this.summary.set(summary); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirmRecurring(ruleId: string): void {
    this.recurringApi.generate(ruleId).subscribe({
      next: () => {
        this.notifications.success('Movimiento generado');
        this.load();
      },
    });
  }

  statusLabel(status: string): string {
    return { ok: 'Bien', warning: 'Atención', exceeded: 'Superado', unbudgeted: 'Sin presupuestar' }[status] ?? status;
  }
}
