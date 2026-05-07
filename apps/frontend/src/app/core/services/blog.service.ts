import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { PaginatedResponse, ApiResponse } from '@eduviet/shared-types';

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

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  status: string;
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
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private readonly API = '/api/blog';

  getAll(filter: BlogFilter = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<BlogListItem>>(this.API, { params });
  }

  getBySlug(slug: string) {
    return this.http.get<ApiResponse<BlogPost>>(`${this.API}/${slug}`);
  }

  addComment(postId: string, content: string, parentId?: string) {
    return this.http.post<ApiResponse<Comment>>(`${this.API}/${postId}/comments`, { content, parentId });
  }
}
