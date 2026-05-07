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

  readonly lastName = computed(() => {
    const parts = (this.user()?.fullName ?? '').split(' ');
    return parts[parts.length - 1] ?? '';
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
}
