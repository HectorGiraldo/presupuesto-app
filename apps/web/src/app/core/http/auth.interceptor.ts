import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/** Añade el token a toda petición a la API, salvo login/register que aún no lo tienen. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const isAuthCall = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');
  if (!token || isAuthCall) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
