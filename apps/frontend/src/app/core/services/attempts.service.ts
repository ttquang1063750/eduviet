import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Attempt,
  AttemptResult,
  AttemptSummary,
  StartAttemptRequest,
  SubmitAttemptRequest,
  GradeAnswerRequest,
} from '@eduviet/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AttemptsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attempts`;

  startAttempt(request: StartAttemptRequest): Observable<{ data: Attempt }> {
    return this.http.post<{ data: Attempt }>(this.apiUrl, request);
  }

  submitAttempt(attemptId: string, request: SubmitAttemptRequest): Observable<{ data: Attempt }> {
    return this.http.post<{ data: Attempt }>(`${this.apiUrl}/${attemptId}/submit`, request);
  }

  getMyHistory(filters: { lessonId?: string; page?: number; perPage?: number } = {}): Observable<{ data: AttemptSummary[]; meta: { total: number } }> {
    return this.http.get<{ data: AttemptSummary[]; meta: { total: number } }>(`${this.apiUrl}/my`, { params: filters as any });
  }

  getResult(id: string): Observable<{ data: AttemptResult }> {
    return this.http.get<{ data: AttemptResult }>(`${this.apiUrl}/${id}`);
  }

  getPendingGrading(page?: number, perPage?: number): Observable<{ data: any[]; meta: { total: number } }> {
    return this.http.get<{ data: any[]; meta: { total: number } }>(`${this.apiUrl}/pending-grading`, { params: { page, perPage } as any });
  }

  gradeAnswer(attemptId: string, answerId: string, request: GradeAnswerRequest): Observable<{ data: any }> {
    return this.http.patch<{ data: any }>(`${this.apiUrl}/${attemptId}/answers/${answerId}/grade`, request);
  }
}
