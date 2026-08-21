import { Routes } from '@angular/router';
import { TasinmazListeComponent } from './components/tasinmaz-liste/tasinmaz-liste';
import { TasinmazFormComponent } from './components/tasinmaz/tasinmaz';
import { Login } from './components/login/login'; 
import { KullaniciListeComponent } from './components/kullanici-liste/kullanici-liste';
import { LogListeComponent } from './components/log-liste/log-liste';
import { AlanAnaliziComponent } from './components/alan-analizi/alan-analizi';

import { girisGuard } from './core/giris.guard';
import { yoneticiGuard } from './core/yonetici.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  
  // Sadece giriş yapmış kullanıcılar görebilir
  { path: 'tasinmaz-liste', component: TasinmazListeComponent, canActivate: [girisGuard] },
  { path: 'tasinmaz-ekle', component: TasinmazFormComponent, canActivate: [girisGuard] },
  { path: 'tasinmaz-duzenle/:id', component: TasinmazFormComponent, canActivate: [girisGuard] },
  
  // Sadece Admin (Yönetici) rolündekiler erişebilir!
  { path: 'kullanici-yonetimi', component: KullaniciListeComponent, canActivate: [yoneticiGuard] },
  { path: 'log-yonetimi', component: LogListeComponent, canActivate: [yoneticiGuard] },

    { path: 'alan-analizi', component: AlanAnaliziComponent, canActivate: [girisGuard] },
  
  { path: '**', redirectTo: 'login' }
  
];