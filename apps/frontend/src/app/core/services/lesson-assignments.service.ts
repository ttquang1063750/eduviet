import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LessonAssignment,
  AssignmentScope,
} from '@eduviet/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LessonAssignmentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/lesson-assignments`;

  listByLesson(lessonId: string): Observable<{ data: LessonAssignment[] }> {
    return this.http.get<{ data: LessonAssignment[] }>(this.apiUrl, {
      params: { lessonId },
    });
  }

  assign(data: {
    lessonId: string;
    scope: AssignmentScope;
    targetId: string;
    note?: string;
    dueDate?: string;
  }): Observable<{ data: LessonAssignment }> {
    return this.http.post<{ data: LessonAssignment }>(this.apiUrl, data);
  }

  unassign(id: string): Observable<{ data: { message: string } }> {
    return this.http.delete<{ data: { message: string } }>(`${this.apiUrl}/${id}`);
  }
}
