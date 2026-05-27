import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const loadingService = inject(LoadingService);
  const notification = inject(NotificationService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const skipLoader = req.headers.has('X-Skip-Loader');

  if (!skipLoader) {
    loadingService.show();
  }

  let authReq = req;
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register') && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    finalize(() => {
      if (!skipLoader) {
        loadingService.hide();
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const isAuthRoute =
        req.url.includes('/auth/login') || req.url.includes('/auth/register');

      let message = 'An unexpected error occurred';

      if (error.status === 401) {
        if (isAuthRoute) {
          return throwError(() => error);
        }
        message = 'Session expired. Please login again.';
        authService.logout(false);
        router.navigate(['/login']);
      } else if (error.status === 403) {
        message = 'You are not authorized to perform this action.';
      } else if (error.status === 422 || error.status === 400) {
        const body = error.error;
        if (body?.message) {
          message = body.message;
        } else if (body?.detail) {
          message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
        } else {
          message = 'Validation error. Please check your input.';
        }
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (error.error?.message) {
        message = error.error.message;
      }

      if (!isAuthRoute) {
        notification.error(message);
      }
      return throwError(() => error);
    })
  );
};
