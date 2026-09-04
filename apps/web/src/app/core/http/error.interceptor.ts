import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications.service';

/**
 * Traduce los errores de la API (formato uniforme { message }) a algo que se
 * puede mostrar directamente, y cierra la sesión si el token ha dejado de ser válido.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationsService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !req.url.includes('/api/auth/login')) {
          auth.logout();
          router.navigate(['/login']);
        }
        const message = Array.isArray(error.error?.message)
          ? error.error.message.join(', ')
          : (error.error?.message ?? 'Ha ocurrido un error inesperado');
        notifications.error(message);
      }
      return throwError(() => error);
    }),
  );
};
