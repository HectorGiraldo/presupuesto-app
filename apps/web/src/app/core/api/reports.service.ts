import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AnnualSummary, CashflowPoint, CategoryTrend, DashboardSummary, EssentialsSplit, MonthlySummary,
} from '@presupuesto/shared';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/reports`;

  monthlySummary(year: number, month: number): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${this.base}/monthly-summary`, { params: { year, month } });
  }

  annualSummary(year: number): Observable<AnnualSummary> {
    return this.http.get<AnnualSummary>(`${this.base}/annual-summary`, { params: { year } });
  }

  categoryTrend(categoryId: string, months = 12): Observable<CategoryTrend> {
    return this.http.get<CategoryTrend>(`${this.base}/category-trend`, { params: { categoryId, months } });
  }

  cashflow(from: string, to: string): Observable<CashflowPoint[]> {
    return this.http.get<CashflowPoint[]>(`${this.base}/cashflow`, { params: { from, to } });
  }

  essentialsSplit(year: number, month: number): Observable<EssentialsSplit> {
    return this.http.get<EssentialsSplit>(`${this.base}/essentials-split`, { params: { year, month } });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${API_BASE}/dashboard`);
  }
}
