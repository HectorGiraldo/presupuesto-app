import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastsComponent } from '../toasts/toasts.component';

interface NavItem {
  path: string;
  label: string;
  icon: SafeHtml;
  primary?: boolean;
}

const ICONS: Record<string, string> = {
  '/dashboard': '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H10v5H5a1 1 0 0 1-1-1z"/>',
  '/transactions': '<path d="M17 4v13m0 0-3.5-3.5M17 17l3.5-3.5"/><path d="M7 20V7m0 0L3.5 10.5M7 7l3.5 3.5"/>',
  '/budget': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
  '/annual': '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  '/recurring': '<path d="M4 12a8 8 0 0 1 13.5-5.8L20 8m0 0V4m0 4h-4"/><path d="M20 12a8 8 0 0 1-13.5 5.8L4 16m0 0v4m0-4h4"/>',
  '/goals': '<path d="M6 21V4h12l-3 4 3 4H6"/>',
  '/debts': '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
  '/reports': '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  '/accounts': '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
  '/categories': '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
  '/settings': '<circle cx="12" cy="12" r="3.2"/><path d="M4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4M7.7 16.3l-1.4 1.4"/>',
};

const SVG_ATTRS =
  'width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

function svg(path: string): string {
  return `<svg ${SVG_ATTRS}>${ICONS[path] ?? ''}</svg>`;
}

const NAV_DEF: Array<{ path: string; label: string; primary?: boolean }> = [
  { path: '/dashboard', label: 'Resumen', primary: true },
  { path: '/transactions', label: 'Movimientos', primary: true },
  { path: '/budget', label: 'Presupuesto', primary: true },
  { path: '/annual', label: 'Vista anual' },
  { path: '/recurring', label: 'Recurrentes' },
  { path: '/goals', label: 'Metas' },
  { path: '/debts', label: 'Deudas' },
  { path: '/reports', label: 'Reportes' },
  { path: '/accounts', label: 'Cuentas' },
  { path: '/categories', label: 'Categorías' },
  { path: '/settings', label: 'Ajustes' },
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
  private readonly sanitizer = inject(DomSanitizer);

  readonly navItems: NavItem[] = NAV_DEF.map((n) => ({
    ...n,
    icon: this.sanitizer.bypassSecurityTrustHtml(svg(n.path)),
  }));
  readonly primaryNav = this.navItems.filter((n) => n.primary);
  readonly moreIcon = this.sanitizer.bypassSecurityTrustHtml(
    `<svg ${SVG_ATTRS}><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>`,
  );
  readonly addIcon = this.sanitizer.bypassSecurityTrustHtml(
    `<svg ${SVG_ATTRS.replace('stroke-width="1.8"', 'stroke-width="2.2"')}><path d="M12 5v14M5 12h14"/></svg>`,
  );

  readonly user = this.auth.user;
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
