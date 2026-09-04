// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  return router.createUrlTree(['/login']);
};

export const factoryGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isFactory) return true;
  return router.createUrlTree([auth.isLoggedIn ? '/retail/dashboard' : '/login']);
};

export const retailGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && !auth.isFactory) return true;
  return router.createUrlTree([auth.isLoggedIn ? '/factory/dashboard' : '/login']);
};
