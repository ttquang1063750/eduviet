import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ReportSummary {
  userCounts: Record<string, number>;
  contentCounts: {
    lessons: number;
    classes: number;
    blogPosts: number;
  };
  loginActivities: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/reports';

  getSummary(): Observable<ReportSummary> {
    return this.http.get<{ data: ReportSummary }>(`${this.apiUrl}/summary`).pipe(
      map(response => response.data)
    );
  }

  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/excel`, { responseType: 'blob' });
  }

  exportPdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/pdf`, { responseType: 'blob' });
  }
}
