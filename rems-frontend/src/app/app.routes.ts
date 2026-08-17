import { Routes } from '@angular/router';
import { TasinmazListeComponent } from './components/tasinmaz-liste/tasinmaz-liste';
import { TasinmazFormComponent } from './components/tasinmaz/tasinmaz';
import { Login } from './components/login/login'; 

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'tasinmaz-liste',
    component: TasinmazListeComponent
  },
  {
    path: 'tasinmaz-ekle',
    component: TasinmazFormComponent
  },
  {
    path: 'tasinmaz-duzenle/:id',
    component: TasinmazFormComponent
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];