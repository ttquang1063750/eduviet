import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, School } from '@eduviet/shared-types';

export interface SchoolFilters {
  page?: number;
  perPage?: number;
  search?: string;
  districtId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/schools`;

  find(filters: SchoolFilters): Observable<PaginatedResponse<School>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.perPage) params = params.set('perPage', filters.perPage.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.districtId) params = params.set('districtId', filters.districtId);

    return this.http.get<PaginatedResponse<School>>(this.apiUrl, { params });
  }

  findById(id: string): Observable<School> {
    return this.http.get<{ data: School }>(`${this.apiUrl}/${id}`).pipe(map(res => res.data));
  }

  create(data: Partial<School>): Observable<School> {
    return this.http.post<{ data: School }>(this.apiUrl, data).pipe(map(res => res.data));
  }

  update(id: string, data: Partial<School>): Observable<School> {
    return this.http.patch<{ data: School }>(`${this.apiUrl}/${id}`, data).pipe(map(res => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
