import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaginatedResponse, BlogPost } from '@eduviet/shared-types';

export interface ModerationFilters {
  page?: number;
  perPage?: number;
  status?: string; // e.g., 'PENDING', 'APPROVED', 'REJECTED'
}

@Injectable({
  providedIn: 'root'
})
export class ContentModerationService {
  private http = inject(HttpClient);
  // Assuming blog is the primary content to moderate for now
  private apiUrl = `${environment.apiUrl}/blog`;

  findPending(filters: ModerationFilters): Observable<PaginatedResponse<BlogPost>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.perPage) params = params.set('perPage', filters.perPage.toString());
    // In a real app, you might have a specific endpoint or query param for pending content
    params = params.set('status', filters.status || 'PENDING');

    return this.http.get<PaginatedResponse<BlogPost>>(this.apiUrl, { params });
  }

  approve(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reject`, { reason });
  }
}
