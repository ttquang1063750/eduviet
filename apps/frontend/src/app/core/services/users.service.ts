import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { PaginatedResponse, ApiResponse, User, UserRole, CreateUserRequest, UpdateUserRequest } from '@eduviet/shared-types';

export interface UserFilter {
  page?: number;
  perPage?: number;
  role?: string;
  search?: string;
  schoolId?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private readonly API = '/api/users';

  getAll(filter: UserFilter = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<User>>(this.API, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<User>>(`${this.API}/${id}`);
  }

  create(data: CreateUserRequest) {
    return this.http.post<ApiResponse<User>>(this.API, data);
  }

  update(id: string, data: UpdateUserRequest) {
    return this.http.patch<ApiResponse<User>>(`${this.API}/${id}`, data);
  }

  changeRole(id: string, role: UserRole) {
    return this.http.patch<ApiResponse<User>>(`${this.API}/${id}/role`, { role });
  }

  assignSchool(id: string, schoolId: string | null) {
    return this.http.patch<ApiResponse<User>>(`${this.API}/${id}/school`, { schoolId });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
