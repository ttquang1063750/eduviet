import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttemptsService } from '../../../core/services/attempts.service';
import type { AttemptSummary } from '@eduviet/shared-types';

@Component({
  selector: 'app-attempt-history',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attempt-history.component.html',
  styleUrl: './attempt-history.component.scss',
})
export class AttemptHistoryComponent implements OnInit {
  private attemptsService = inject(AttemptsService);

  readonly loading = signal(true);
  readonly attempts = signal<AttemptSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = 10;
  readonly totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.attemptsService.getMyHistory({
      page: this.page(),
      perPage: this.perPage,
    }).subscribe({
      next: (res) => {
        const mapped: AttemptSummary[] = (res.data as AttemptSummary[]).map(a => ({
          id: a.id,
          lessonTitle: a.lesson.title,
          lessonSlug: a.lesson.slug,
          mode: a.mode,
          status: a.status,
          score: a.totalScore,
          maxScore: a.maxScore,
          submittedAt: a.submittedAt,
        }));
        this.attempts.set(mapped);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadHistory();
  }

  getScoreColor(score: number | null, max: number | null): string {
    if (score === null || !max) return 'var(--mat-sys-on-surface-variant)';
    const p = (score / max) * 100;
    if (p >= 80) return '#166534'; // Green
    if (p >= 50) return '#9a3412'; // Amber
    return '#b91c1c'; // Red
  }
}
