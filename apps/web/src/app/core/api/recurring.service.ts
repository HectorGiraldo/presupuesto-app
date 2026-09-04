import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CreateRecurringRuleDto, PendingRecurring, RecurringRule, UpdateRecurringRuleDto,
} from '@presupuesto/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RecurringApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/recurring';

  findAll(includeInactive = false): Observable<RecurringRule[]> {
    return this.http.get<RecurringRule[]>(this.base, { params: { includeInactive } });
  }

  pending(): Observable<PendingRecurring[]> {
    return this.http.get<PendingRecurring[]>(`${this.base}/pending`);
  }

  create(dto: CreateRecurringRuleDto): Observable<RecurringRule> {
    return this.http.post<RecurringRule>(this.base, dto);
  }

  update(id: string, dto: UpdateRecurringRuleDto): Observable<RecurringRule> {
    return this.http.patch<RecurringRule>(`${this.base}/${id}`, dto);
  }

  generate(id: string): Observable<{ generated: number }> {
    return this.http.post<{ generated: number }>(`${this.base}/${id}/generate`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
