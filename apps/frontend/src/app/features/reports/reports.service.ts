import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/reports`;

  getSummary(): Observable<ReportSummary> {
    return this.http.get<{ data: ReportSummary }>(`${this.apiUrl}/summary`).pipe(
      map(response => response.data)
    );
  }
}
