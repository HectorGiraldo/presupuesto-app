import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { BackupPayload } from '@presupuesto/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackupApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/backup';

  export(): Observable<BackupPayload> {
    return this.http.get<BackupPayload>(`${this.base}/export`);
  }

  import(payload: BackupPayload): Observable<{ imported: Record<string, number> }> {
    return this.http.post<{ imported: Record<string, number> }>(`${this.base}/import`, payload);
  }
}
