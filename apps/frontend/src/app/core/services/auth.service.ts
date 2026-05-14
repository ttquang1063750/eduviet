import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY, of, Observable, map } from 'rxjs';
import type { AuthUser, LoginRequest, LoginResponse, UserRole } from '@eduviet/shared-types';
import { PushNotificationService } from './push-notification.service';

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private pushNotification = inject(PushNotificationService);

  private readonly API = '/api/auth';

  private _user = signal<AuthUser | null>(null);
  private _isLoading = signal(false);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  /** Mảng roles của user hiện tại */
  readonly currentRoles = computed(() => this._user()?.roles ?? []);
  /** Role đầu tiên — dùng cho display label, không dùng cho RBAC checks */
  readonly currentRole = computed(() => this._user()?.roles?.[0] ?? null);

  constructor() {}

  init(): Observable<AuthUser | null> {
    const token = this.getAccessToken();
    if (!token) return of(null);

    return this.http.get<ApiResponse<AuthUser>>(`${this.API}/me`).pipe(
      tap((res) => this._user.set(res.data)),
      map(res => res.data),
      catchError(() => {
        this.clearAuth();
        return of(null);
      })
    );
  }

  private loadCurrentUser() {
    this.init().subscribe();
  }

  login(credentials: LoginRequest) {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/login`, credentials).pipe(
      tap((res) => {
        this.setAccessToken(res.data.accessToken);
        this._user.set(res.data.user);
        this._isLoading.set(false);
        this.router.navigate(['/dashboard']);
        // Xin quyền push notification sau khi login thành công
        void this.pushNotification.requestPermission();
      }),
      catchError((err) => {
        this._isLoading.set(false);
        throw err;
      })
    );
  }

  logout() {
    return this.http.post(`${this.API}/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      }),
      catchError(() => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
        return EMPTY;
      })
    );
  }

  refreshToken() {
    return this.http.post<ApiResponse<{ accessToken: string }>>(`${this.API}/refresh`, {}).pipe(
      tap((res) => this.setAccessToken(res.data.accessToken))
    );
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  private setAccessToken(token: string) {
    sessionStorage.setItem('access_token', token);
  }

  private clearAuth() {
    sessionStorage.removeItem('access_token');
    this._user.set(null);
  }

  /** OR logic — pass nếu user có ít nhất 1 role trong danh sách */
  hasRole(...roles: UserRole[]): boolean {
    const userRoles = this.currentRoles();
    return userRoles.some((r) => roles.includes(r));
  }
}
