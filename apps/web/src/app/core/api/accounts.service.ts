import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Account, CreateAccountDto, UpdateAccountDto } from '@presupuesto/shared';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class AccountsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/accounts`;

  findAll(includeArchived = false): Observable<Account[]> {
    return this.http.get<Account[]>(this.base, { params: { includeArchived } });
  }

  balances(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.base}/balances`);
  }

  create(dto: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>(this.base, dto);
  }

  update(id: string, dto: UpdateAccountDto): Observable<Account> {
    return this.http.patch<Account>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<{ deleted: boolean; archived: boolean }> {
    return this.http.delete<{ deleted: boolean; archived: boolean }>(`${this.base}/${id}`);
  }
}
