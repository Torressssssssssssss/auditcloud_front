import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withInterceptors } from '@angular/common/http';

import { EstrategiaTituloPagina } from './services/titulo-pagina.service';
import { interceptorPerfilEmpresa } from './services/perfil-empresa.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: EstrategiaTituloPagina },
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([interceptorPerfilEmpresa]))
  ]
};
