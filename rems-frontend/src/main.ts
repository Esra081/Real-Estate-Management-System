import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // Eğer app.config app klasöründeyse './app/app.config' olmalı
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));