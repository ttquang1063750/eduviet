import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  provideEnvironmentInitializer,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import localeEn from '@angular/common/locales/en';
import { provideMarkdown, MARKED_EXTENSIONS, SANITIZE } from 'ngx-markdown';
import { provideQuillConfig } from 'ngx-quill';
import { HttpClient } from '@angular/common/http';
import { SecurityContext } from '@angular/core';
import markedKatex from 'marked-katex-extension';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './features/chat/chat.service';

// CLDR data cho format date/number/currency theo locale.
// LOCALE_ID được Angular set tại build time qua angular.json i18n config.
registerLocaleData(localeVi);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // authService.init() chạy trước khi app render (await Promise)
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.init();
    }),
    // Eager-instantiate ChatService ngay khi app start để effect() tự connect socket khi user đăng nhập
    provideEnvironmentInitializer(() => {
      inject(ChatService);
    }),
    // SANITIZE token — cần thiết để KaTeX render HTML/SVG không bị Angular sanitizer cắt
    provideMarkdown({
      loader: HttpClient,
      sanitize: { provide: SANITIZE, useValue: SecurityContext.NONE },
    }),
    provideQuillConfig({
      modules: {
        syntax: false,
        toolbar: false,
      },
    }),
    {
      provide: MARKED_EXTENSIONS,
      useFactory: () =>
        markedKatex({
          throwOnError: false,
          // displayMode: false — inline mode mặc định; $$...$$ tự động chuyển display mode
        }),
      multi: true,
    },
  ],
};
