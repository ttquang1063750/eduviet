import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
  ENVIRONMENT_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMarkdown, MARKED_EXTENSIONS, SANITIZE } from 'ngx-markdown';
import { provideQuillConfig } from 'ngx-quill';
import { HttpClient } from '@angular/common/http';
import { SecurityContext } from '@angular/core';
import markedKatex from 'marked-katex-extension';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './features/chat/chat.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.init(),
      deps: [AuthService],
      multi: true,
    },
    // Eager-instantiate ChatService ngay khi app start để effect() tự connect socket khi user đăng nhập
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => inject(ChatService),
      multi: true,
    },
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
