import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const dashboardFor = (auth: AuthService) => {
  if (auth.isAdmin) return '/admin';
  if (auth.isFactory) return '/factory';
  return '/retail';
};

// Keep signed-in users out of the login screen. This is also what restores the
// correct dashboard when they reopen the site's root URL in a new browser session.
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? router.parseUrl(dashboardFor(auth)) : true;
};

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  router.navigate(['/login']);
  return false;
};

export const factoryGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && (auth.isFactory || auth.isAdmin)) return true;
  router.navigate(['/login']);
  return false;
};

export const retailGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && !auth.isFactory && !auth.isAdmin) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isAdmin) return true;
  router.navigate(['/login']);
  return false;
};
