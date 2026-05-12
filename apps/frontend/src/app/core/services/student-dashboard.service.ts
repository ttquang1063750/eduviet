import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse, StudentDashboard } from '@eduviet/shared-types';

@Injectable({ providedIn: 'root' })
export class StudentDashboardService {
  private http = inject(HttpClient);
  private readonly API = '/api/students';

  /** Dashboard cá nhân của học sinh — lớp học + bài học + tiến độ */
  getMyDashboard() {
    return this.http.get<ApiResponse<StudentDashboard>>(`${this.API}/me/dashboard`);
  }
}
