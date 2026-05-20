import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AppStorageService } from './core/services/app-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AppStorageService],
      useFactory: (storage: AppStorageService) => () => storage.init()
    }
  ]
};
