import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  BudgetLine, BudgetProgress, CopyBudgetDto, UpsertBudgetLineDto,
} from '@presupuesto/shared';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class BudgetsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/budgets`;

  findAll(year: number, month: number | null): Observable<BudgetLine[]> {
    const params: Record<string, number> = { year };
    if (month) params['month'] = month;
    return this.http.get<BudgetLine[]>(this.base, { params });
  }

  progress(year: number, month: number): Observable<BudgetProgress> {
    return this.http.get<BudgetProgress>(`${this.base}/progress`, { params: { year, month } });
  }

  upsert(dto: UpsertBudgetLineDto): Observable<BudgetLine> {
    return this.http.post<BudgetLine>(this.base, dto);
  }

  copyFromPrevious(dto: CopyBudgetDto): Observable<BudgetLine[]> {
    return this.http.post<BudgetLine[]>(`${this.base}/copy-from-previous`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
