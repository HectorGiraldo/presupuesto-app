import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CreateContributionDto, CreateGoalDto, Goal, GoalContribution, UpdateGoalDto,
} from '@presupuesto/shared';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';

@Injectable({ providedIn: 'root' })
export class GoalsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/goals`;

  findAll(includeArchived = false): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.base, { params: { includeArchived } });
  }

  findOne(id: string): Observable<Goal> {
    return this.http.get<Goal>(`${this.base}/${id}`);
  }

  contributions(id: string): Observable<GoalContribution[]> {
    return this.http.get<GoalContribution[]>(`${this.base}/${id}/contributions`);
  }

  create(dto: CreateGoalDto): Observable<Goal> {
    return this.http.post<Goal>(this.base, dto);
  }

  addContribution(id: string, dto: CreateContributionDto): Observable<Goal> {
    return this.http.post<Goal>(`${this.base}/${id}/contributions`, dto);
  }

  update(id: string, dto: UpdateGoalDto): Observable<Goal> {
    return this.http.patch<Goal>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
