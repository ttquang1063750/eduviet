import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LessonsService } from '../../core/services/lessons.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private lessonsService = inject(LessonsService);

  readonly user = this.authService.user;
  readonly isAdmin = computed(() =>
    this.authService.hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN')
  );
  readonly isContentCreator = computed(() =>
    this.authService.hasRole('CONTENT_CREATOR', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER')
  );

  readonly lessonsLoading = signal(true);
  readonly recentLessons = signal<
    {
      id: string;
      title: string;
      slug: string;
      grade: number;
      difficulty: string;
      estimatedMinutes: number;
      subject: { name: string; color: string | null };
    }[]
  >([]);
  readonly totalLessons = signal(0);

  readonly userInitial = computed(() => {
    const parts = (this.user()?.fullName ?? '').split(' ');
    const last = parts[parts.length - 1];
    return last ? last[0].toUpperCase() : '?';
  });

  readonly lastName = computed(() => {
    const parts = (this.user()?.fullName ?? '').split(' ');
    return parts[parts.length - 1] ?? '';
  });

  readonly roleLabel = computed(() => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      PROVINCE_ADMIN: 'Quản trị tỉnh',
      DISTRICT_ADMIN: 'Quản trị huyện',
      SCHOOL_ADMIN: 'Quản trị trường',
      CONTENT_CREATOR: 'Soạn thảo viên',
      CONTENT_REVIEWER: 'Reviewer',
      CONTENT_APPROVER: 'Phê duyệt viên',
      GRADER: 'Chấm điểm',
      HOMEROOM_TEACHER: 'Giáo viên chủ nhiệm',
      SUBJECT_TEACHER: 'Giáo viên bộ môn',
      STUDENT: 'Học sinh',
      PARENT: 'Phụ huynh',
    };
    return labels[this.user()?.role ?? ''] ?? '';
  });

  ngOnInit() {
    this.lessonsService.getAll({ perPage: 6 }).subscribe({
      next: (res) => {
        this.recentLessons.set(res.data as never);
        this.totalLessons.set(res.meta.total);
        this.lessonsLoading.set(false);
      },
      error: () => this.lessonsLoading.set(false),
    });
  }

  difficultyLabel(d: string): string {
    const labels: Record<string, string> = {
      EASY: 'Dễ',
      MEDIUM: 'Trung bình',
      HARD: 'Khó',
      ADVANCED: 'Nâng cao',
    };
    return labels[d] ?? d;
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
