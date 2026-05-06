import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import type { User, PaginatedResponse } from '@eduviet/shared-types';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.scss',
})
export class UsersAdminComponent implements OnInit {
  private http = inject(HttpClient);

  readonly loading = signal(true);
  readonly users = signal<User[]>([]);
  readonly total = signal(0);

  ngOnInit() {
    this.http.get<PaginatedResponse<User>>('/api/users').subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      SCHOOL_ADMIN: 'Admin Trường',
      CONTENT_CREATOR: 'Soạn thảo',
      CONTENT_REVIEWER: 'Reviewer',
      CONTENT_APPROVER: 'Phê duyệt',
      SUBJECT_TEACHER: 'Giáo viên',
      HOMEROOM_TEACHER: 'GV Chủ nhiệm',
      STUDENT: 'Học sinh',
      PARENT: 'Phụ huynh',
    };
    return labels[role] ?? role;
  }
}
