import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { LessonListItem, Lesson, CreateLessonRequest, PaginatedResponse, ApiResponse } from '@eduviet/shared-types';

interface LessonFilter {
  page?: number;
  perPage?: number;
  subject?: string;
  grade?: number;
  difficulty?: string;
  status?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class LessonsService {
  private http = inject(HttpClient);
  private readonly API = '/api/lessons';

  getAll(filter: LessonFilter = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<LessonListItem>>(this.API, { params });
  }

  getBySlug(slug: string) {
    return this.http.get<ApiResponse<Lesson>>(`${this.API}/${slug}`);
  }

  create(data: CreateLessonRequest) {
    return this.http.post<ApiResponse<Lesson>>(this.API, data);
  }

  submitReview(id: string) {
    return this.http.post<ApiResponse<LessonListItem>>(`${this.API}/${id}/submit-review`, {});
  }

  review(id: string, action: 'approve' | 'reject', note?: string) {
    return this.http.post<ApiResponse<LessonListItem>>(`${this.API}/${id}/review`, { action, note });
  }

  publish(id: string) {
    return this.http.post<ApiResponse<LessonListItem>>(`${this.API}/${id}/publish`, {});
  }
}
