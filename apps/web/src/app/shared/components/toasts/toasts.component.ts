import { Component, inject } from '@angular/core';
import { NotificationsService } from '../../../core/notifications.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
    <div class="toasts">
      @for (n of notifications.notifications(); track n.id) {
        <div class="toast" [class]="'toast-' + n.kind" (click)="notifications.dismiss(n.id)">
          {{ n.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      left: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      z-index: 100;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      max-width: 340px;
      padding: 0.7rem 0.95rem;
      border: 1.5px solid var(--color-line-strong);
      border-radius: var(--radius-sm);
      color: #fff;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: var(--shadow);
      cursor: pointer;
    }
    .toast-success { background: var(--color-success); }
    .toast-error { background: var(--color-danger); }
    .toast-info { background: var(--color-text); }

    @media (max-width: 860px) {
      .toasts { bottom: calc(var(--bottomnav-h) + 1rem + env(safe-area-inset-bottom)); }
    }
  `],
})
export class ToastsComponent {
  protected readonly notifications = inject(NotificationsService);
}
