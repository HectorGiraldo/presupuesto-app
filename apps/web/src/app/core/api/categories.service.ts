import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@presupuesto/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/categories';

  findAll(includeArchived = false): Observable<Category[]> {
    return this.http.get<Category[]>(this.base, { params: { includeArchived } });
  }

  findTree(includeArchived = false): Observable<Category[]> {
    return this.http.get<Category[]>(this.base, { params: { tree: true, includeArchived } });
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(this.base, dto);
  }

  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<{ deleted: boolean; archived: boolean }> {
    return this.http.delete<{ deleted: boolean; archived: boolean }>(`${this.base}/${id}`);
  }
}
