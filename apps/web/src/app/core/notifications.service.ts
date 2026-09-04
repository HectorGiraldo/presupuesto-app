import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

/** Toasts simples para confirmar acciones o mostrar errores de la API. */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private nextId = 1;
  readonly notifications = signal<Notification[]>([]);

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message, 6000);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  private push(kind: Notification['kind'], message: string, ttl = 3500): void {
    const id = this.nextId++;
    this.notifications.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
}
