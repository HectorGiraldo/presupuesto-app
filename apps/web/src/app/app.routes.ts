import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { ShellComponent } from './shared/components/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions-page.component').then((m) => m.TransactionsPageComponent),
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget-page.component').then((m) => m.BudgetPageComponent),
      },
      {
        path: 'annual',
        loadComponent: () => import('./features/annual/annual-page.component').then((m) => m.AnnualPageComponent),
      },
      {
        path: 'recurring',
        loadComponent: () => import('./features/recurring/recurring-page.component').then((m) => m.RecurringPageComponent),
      },
      {
        path: 'goals',
        loadComponent: () => import('./features/goals/goals-page.component').then((m) => m.GoalsPageComponent),
      },
      {
        path: 'debts',
        loadComponent: () => import('./features/debts/debts-page.component').then((m) => m.DebtsPageComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports-page.component').then((m) => m.ReportsPageComponent),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts-page.component').then((m) => m.AccountsPageComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories-page.component').then((m) => m.CategoriesPageComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings-page.component').then((m) => m.SettingsPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
