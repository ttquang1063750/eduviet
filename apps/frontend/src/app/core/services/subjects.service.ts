import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Subject, SubjectCode } from '@eduviet/shared-types';

export interface CreateSubjectRequest {
  code: SubjectCode;
  name: string;
  nameEn: string;
  color?: string;
  iconUrl?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  nameEn?: string;
  color?: string;
  iconUrl?: string;
}

export interface SubjectSuggestion {
  name: string;
  nameEn: string;
  color: string;
  iconUrl: string;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private http = inject(HttpClient);
  private readonly API = '/api/subjects';

  list(): Observable<Subject[]> {
    return this.http
      .get<ApiResponse<Subject[]>>(this.API)
      .pipe(map((res) => res.data));
  }

  create(data: CreateSubjectRequest): Observable<Subject> {
    return this.http
      .post<ApiResponse<Subject>>(this.API, data)
      .pipe(map((res) => res.data));
  }

  update(id: string, data: UpdateSubjectRequest): Observable<Subject> {
    return this.http
      .patch<ApiResponse<Subject>>(`${this.API}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  suggest(code: SubjectCode): Observable<SubjectSuggestion> {
    return this.http
      .get<ApiResponse<SubjectSuggestion>>(`${this.API}/suggest`, {
        params: { code },
      })
      .pipe(map((res) => res.data));
  }
}
