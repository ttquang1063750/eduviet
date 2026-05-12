import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { StudentDashboardService } from '../../core/services/student-dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { getApiErrorMessage } from '../../core/utils/http-error';
import type { StudentDashboard } from '@eduviet/shared-types';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent implements OnInit {
  private dashboardService = inject(StudentDashboardService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private breadcrumb = inject(BreadcrumbService);

  isLoading = signal(true);
  dashboard = signal<StudentDashboard | null>(null);
  error = signal<string | null>(null);

  currentUser = this.authService.user;

  completionPercent = computed(() => {
    const d = this.dashboard();
    if (!d || d.progress.totalLessons === 0) return 0;
    return Math.round((d.progress.completedLessons / d.progress.totalLessons) * 100);
  });

  totalLessons = computed(() => {
    const d = this.dashboard();
    return d?.classes.reduce((sum, c) => sum + c.lessons.length, 0) ?? 0;
  });

  ngOnInit(): void {
    this.breadcrumb.setLabel('student', 'Trang của tôi');
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService.getMyDashboard().subscribe({
      next: (res) => {
        this.dashboard.set(res.data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(getApiErrorMessage(err, 'Không thể tải dashboard'));
        this.toast.error(this.error() ?? 'Lỗi tải dữ liệu');
        this.isLoading.set(false);
      },
    });
  }

  getDifficultyLabel(difficulty: string): string {
    const map: Record<string, string> = {
      EASY: 'Dễ',
      MEDIUM: 'Trung bình',
      HARD: 'Khó',
      ADVANCED: 'Nâng cao',
    };
    return map[difficulty] ?? difficulty;
  }

  getDifficultyColor(difficulty: string): string {
    const map: Record<string, string> = {
      EASY: 'primary',
      MEDIUM: 'accent',
      HARD: 'warn',
      ADVANCED: 'warn',
    };
    return map[difficulty] ?? 'primary';
  }

  getGradeLabel(grade: number): string {
    return `Lớp ${grade}`;
  }
}
