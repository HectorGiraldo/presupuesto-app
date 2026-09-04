import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthResponse, User } from '@presupuesto/shared';
import { Observable, tap } from 'rxjs';

const TOKEN_KEY = 'presupuesto.token';
const USER_KEY = 'presupuesto.user';

/**
 * Sesión del usuario en signals. Se guarda en localStorage para no tener que
 * volver a iniciar sesión cada vez que se recarga la página.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<User | null>(this.readStoredUser());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { email, password, name }).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  /** Llamado al arrancar la app para comprobar que el token guardado sigue siendo válido. */
  refreshMe(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap((user) => {
        this._user.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private setSession(res: AuthResponse): void {
    this._user.set(res.user);
    this._token.set(res.accessToken);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }
}
