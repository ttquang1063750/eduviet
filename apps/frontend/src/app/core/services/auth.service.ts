import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import type { AuthUser, LoginRequest, LoginResponse } from '@eduviet/shared-types';

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API = '/api/auth';

  private _user = signal<AuthUser | null>(null);
  private _isLoading = signal(false);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly currentRole = computed(() => this._user()?.role ?? null);

  constructor() {
    this.loadCurrentUser();
  }

  private loadCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return;

    this.http.get<ApiResponse<AuthUser>>(`${this.API}/me`).subscribe({
      next: (res) => this._user.set(res.data),
      error: () => this.clearAuth(),
    });
  }

  login(credentials: LoginRequest) {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/login`, credentials).pipe(
      tap((res) => {
        this.setAccessToken(res.data.accessToken);
        this._user.set(res.data.user);
        this._isLoading.set(false);
        this.router.navigate(['/dashboard']);
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

  hasRole(...roles: string[]): boolean {
    const role = this.currentRole();
    return role !== null && roles.includes(role);
  }
}
