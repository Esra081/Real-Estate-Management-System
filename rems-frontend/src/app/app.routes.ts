import { Routes } from '@angular/router';
import { girisGuard } from './core/giris.guard';
import { yoneticiGuard } from './core/yonetici.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'tasinmaz-liste', 
    loadComponent: () => import('./components/tasinmaz-liste/tasinmaz-liste.component').then(m => m.TasinmazListeComponent), 
    canActivate: [girisGuard] 
  },
  { 
    path: 'tasinmaz-ekle', 
    loadComponent: () => import('./components/tasinmaz-form/tasinmaz-form.component').then(m => m.TasinmazFormComponent), 
    canActivate: [girisGuard] 
  },
  { 
    path: 'tasinmaz-duzenle/:id', 
    loadComponent: () => import('./components/tasinmaz-form/tasinmaz-form.component').then(m => m.TasinmazFormComponent), 
    canActivate: [girisGuard] 
  },
  { 
    path: 'kullanici-yonetimi', 
    loadComponent: () => import('./components/kullanici-liste/kullanici-liste.component').then(m => m.KullaniciListeComponent), 
    canActivate: [yoneticiGuard] 
  },
  { 
    path: 'log-yonetimi', 
    loadComponent: () => import('./components/log-liste/log-liste.component').then(m => m.LogListeComponent), 
    canActivate: [yoneticiGuard] 
  },
  { 
    path: 'alan-analizi', 
    loadComponent: () => import('./components/alan-analizi/alan-analizi.component').then(m => m.AlanAnaliziComponent), 
    canActivate: [girisGuard] 
  },
  { path: '**', redirectTo: 'login' }
];