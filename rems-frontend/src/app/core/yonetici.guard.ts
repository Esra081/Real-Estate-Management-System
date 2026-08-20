import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const yoneticiGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Kullanıcı giriş yapmış ve rolü Admin ise izin ver
  if (authService.isLoggedIn && authService.isAdmin) {
    return true;
  }

  // Yetkisi yoksa ana taşınmaz listesine yönlendir
  router.navigate(['/tasinmaz-liste']);
  return false;
};