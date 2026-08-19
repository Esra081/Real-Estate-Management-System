import { Routes } from '@angular/router';
import { TasinmazListeComponent } from './components/tasinmaz-liste/tasinmaz-liste';
import { TasinmazFormComponent } from './components/tasinmaz/tasinmaz';
import { Login } from './components/login/login'; 
import { KullaniciListeComponent } from './components/kullanici-liste/kullanici-liste';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'tasinmaz-liste', component: TasinmazListeComponent },
  { path: 'tasinmaz-ekle', component: TasinmazFormComponent },
  { path: 'tasinmaz-duzenle/:id', component: TasinmazFormComponent },
  { path: 'kullanici-yonetimi', component: KullaniciListeComponent }, // 👈 Kullanıcı Yönetimi Rotası
  { path: '**', redirectTo: 'login' }
];