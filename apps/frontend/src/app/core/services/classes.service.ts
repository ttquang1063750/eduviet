import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { PaginatedResponse, ApiResponse } from '@eduviet/shared-types';

export interface ClassItem {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  school: { id: string; name: string };
  homeroomTeacher: { id: string; fullName: string; email: string; avatarUrl: string | null } | null;
  _count: { enrollments: number };
  createdAt: string;
}

export interface ClassDetail extends ClassItem {
  enrollments: Array<{
    id: string;
    user: { id: string; fullName: string; email: string; avatarUrl: string | null; roles: string[] };
    createdAt: string;
  }>;
}

export interface ClassFilter {
  page?: number;
  perPage?: number;
  schoolId?: string;
  grade?: number;
  academicYear?: string;
}

export interface CreateClassRequest {
  name: string;
  grade: number;
  academicYear: string;
  schoolId: string;
  homeroomTeacherId?: string;
}

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private http = inject(HttpClient);
  private readonly API = '/api/classes';

  getAll(filter: ClassFilter = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<ClassItem>>(this.API, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<ClassDetail>>(`${this.API}/${id}`);
  }

  create(data: CreateClassRequest) {
    return this.http.post<ApiResponse<ClassItem>>(this.API, data);
  }

  update(id: string, data: Partial<{ name: string; homeroomTeacherId: string | null }>) {
    return this.http.patch<ApiResponse<ClassItem>>(`${this.API}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API}/${id}`);
  }

  enroll(classId: string, userId: string) {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/${classId}/enrollments`, { userId });
  }

  unenroll(classId: string, userId: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API}/${classId}/enrollments/${userId}`);
  }
}
