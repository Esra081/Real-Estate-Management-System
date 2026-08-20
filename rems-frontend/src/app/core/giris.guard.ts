import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const girisGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Kullanıcı oturum açmışsa sayfaya geçişe izin ver
  if (authService.isLoggedIn) {
    return true;
  }

  // Giriş yapmamışsa login sayfasına yönlendir
  router.navigate(['/login']);
  return false;
};