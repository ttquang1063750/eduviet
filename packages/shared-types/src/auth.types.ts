import type { UserRole } from './user.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  title: string | null;
  avatarUrl: string | null;
  schoolId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}
