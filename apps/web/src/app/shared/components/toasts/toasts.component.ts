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
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 100;
      max-width: 320px;
    }
    .toast {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: #fff;
      font-size: 0.88rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
    }
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
    .toast-info { background: #334155; }
  `],
})
export class ToastsComponent {
  protected readonly notifications = inject(NotificationsService);
}
