import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  return session ? true : inject(Router).createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  const router = inject(Router);
  if (!session) return router.createUrlTree(['/login']);
  return session.role === 'admin' ? true : router.createUrlTree(['/']);
};

// Login y registro no tienen sentido con la sesión iniciada
export const guestGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  return session ? inject(Router).createUrlTree(['/']) : true;
};
