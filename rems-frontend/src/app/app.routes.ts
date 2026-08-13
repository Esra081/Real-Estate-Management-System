import { Routes } from '@angular/router';
import { TasinmazListeComponent } from './components/tasinmaz-liste/tasinmaz-liste';
import { TasinmazFormComponent } from './components/tasinmaz/tasinmaz';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tasinmaz-liste',
    pathMatch: 'full'
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
  }
];