import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface GeoNode {
  id: string;
  name: string;
  code: string;
}

export interface Province extends GeoNode {
  nationId: string;
}

export interface District extends GeoNode {
  provinceId: string;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  private http = inject(HttpClient);

  private readonly API = '/api/geo';

  getNations(): Observable<GeoNode[]> {
    return this.http
      .get<ApiResponse<GeoNode[]>>(`${this.API}/nations`)
      .pipe(map((res) => res.data));
  }

  getProvinces(nationId: string): Observable<Province[]> {
    return this.http
      .get<ApiResponse<Province[]>>(`${this.API}/provinces`, {
        params: { nationId },
      })
      .pipe(map((res) => res.data));
  }

  getDistricts(provinceId: string): Observable<District[]> {
    return this.http
      .get<ApiResponse<District[]>>(`${this.API}/districts`, {
        params: { provinceId },
      })
      .pipe(map((res) => res.data));
  }
}
