import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { PaginatedResponse, ApiResponse } from '@eduviet/shared-types';
import { Observable, map } from 'rxjs';

export interface BlogAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: BlogAuthor;
  createdAt: string;
  replies: Comment[];
}

export type BlogStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  status: BlogStatus;
  tags: string[];
  publishedAt: string | null;
  author: BlogAuthor;
  _count: { comments: number };
  createdAt: string;
}

export interface BlogPost extends BlogListItem {
  content: string;
  comments: Comment[];
}

export interface BlogFilter {
  page?: number;
  perPage?: number;
  tag?: string;
  search?: string;
  status?: BlogStatus;
  authorId?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  coverImage?: string;
  tags?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private readonly API = '/api/blog';

  getAll(filter: BlogFilter = {}): Observable<PaginatedResponse<BlogListItem>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<BlogListItem>>(this.API, { params });
  }

  getBySlug(slug: string): Observable<ApiResponse<BlogPost>> {
    return this.http.get<ApiResponse<BlogPost>>(`${this.API}/${slug}`);
  }

  getById(id: string): Observable<BlogPost> {
    // Backend uses slug as URL param, but we can also pass ID
    return this.http
      .get<ApiResponse<BlogPost>>(`${this.API}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(data: CreatePostRequest): Observable<BlogListItem> {
    return this.http
      .post<ApiResponse<BlogListItem>>(this.API, data)
      .pipe(map((res) => res.data));
  }

  update(id: string, data: UpdatePostRequest): Observable<BlogListItem> {
    return this.http
      .patch<ApiResponse<BlogListItem>>(`${this.API}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  submitForReview(id: string): Observable<BlogListItem> {
    return this.http
      .post<ApiResponse<BlogListItem>>(`${this.API}/${id}/submit-review`, {})
      .pipe(map((res) => res.data));
  }

  publish(id: string): Observable<BlogListItem> {
    return this.http
      .post<ApiResponse<BlogListItem>>(`${this.API}/${id}/publish`, {})
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  addComment(postId: string, content: string, parentId?: string): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`${this.API}/${postId}/comments`, {
      content,
      parentId,
    });
  }

  hideComment(commentId: string): Observable<Comment> {
    return this.http
      .patch<ApiResponse<Comment>>(`${this.API}/comments/${commentId}/hide`, {})
      .pipe(map((res) => res.data));
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/comments/${commentId}`);
  }
}
