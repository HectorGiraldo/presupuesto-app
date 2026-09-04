import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastsComponent } from '../toasts/toasts.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Resumen', icon: '🏠' },
  { path: '/transactions', label: 'Movimientos', icon: '💶' },
  { path: '/budget', label: 'Presupuesto', icon: '🎯' },
  { path: '/annual', label: 'Vista anual', icon: '📅' },
  { path: '/recurring', label: 'Recurrentes', icon: '🔁' },
  { path: '/goals', label: 'Metas', icon: '🏆' },
  { path: '/debts', label: 'Deudas', icon: '🏦' },
  { path: '/reports', label: 'Reportes', icon: '📊' },
  { path: '/accounts', label: 'Cuentas', icon: '👛' },
  { path: '/categories', label: 'Categorías', icon: '🏷️' },
  { path: '/settings', label: 'Ajustes', icon: '⚙️' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = NAV_ITEMS;
  readonly user = this.auth.user;
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
