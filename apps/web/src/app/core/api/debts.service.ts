import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AmortizationSchedule, CreateDebtDto, CreateDebtPaymentDto, Debt, DebtPayment, UpdateDebtDto,
} from '@presupuesto/shared';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class DebtsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/debts`;

  findAll(includeArchived = false): Observable<Debt[]> {
    return this.http.get<Debt[]>(this.base, { params: { includeArchived } });
  }

  findOne(id: string): Observable<Debt> {
    return this.http.get<Debt>(`${this.base}/${id}`);
  }

  payments(id: string): Observable<DebtPayment[]> {
    return this.http.get<DebtPayment[]>(`${this.base}/${id}/payments`);
  }

  amortization(id: string): Observable<AmortizationSchedule> {
    return this.http.get<AmortizationSchedule>(`${this.base}/${id}/amortization`);
  }

  create(dto: CreateDebtDto): Observable<Debt> {
    return this.http.post<Debt>(this.base, dto);
  }

  addPayment(id: string, dto: CreateDebtPaymentDto): Observable<Debt> {
    return this.http.post<Debt>(`${this.base}/${id}/payments`, dto);
  }

  update(id: string, dto: UpdateDebtDto): Observable<Debt> {
    return this.http.patch<Debt>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
