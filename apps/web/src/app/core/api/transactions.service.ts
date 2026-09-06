import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CreateTransactionDto, Transaction, TransactionList, TransactionQuery, UpdateTransactionDto,
} from '@presupuesto/shared';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/transactions`;

  findAll(query: TransactionQuery = {}): Observable<TransactionList> {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params[key] = value as string | number;
    }
    return this.http.get<TransactionList>(this.base, { params });
  }

  findOne(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.base}/${id}`);
  }

  create(dto: CreateTransactionDto): Observable<Transaction> {
    return this.http.post<Transaction>(this.base, dto);
  }

  update(id: string, dto: UpdateTransactionDto): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
