import { Component, inject, signal, input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { LessonsService } from '../../../core/services/lessons.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ToastService } from '../../../core/services/toast.service';
import { AttemptsService } from '../../../core/services/attempts.service';
import { DrawingCanvasComponent } from '../../../shared/components/drawing-canvas/drawing-canvas.component';
import { ExamTimerComponent } from './exam-timer.component';
import type { Lesson, AttemptMode, Attempt } from '@eduviet/shared-types';
import { getApiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownComponent, DrawingCanvasComponent, ExamTimerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-detail.component.html',
  styleUrl: './lesson-detail.component.scss',
})
export class LessonDetailComponent implements OnInit {
  private lessonsService = inject(LessonsService);
  private breadcrumbService = inject(BreadcrumbService);
  private toastService = inject(ToastService);
  private attemptsService = inject(AttemptsService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);

  readonly slug = input.required<string>();
  readonly loading = signal(true);
  readonly lesson = signal<Lesson | null>(null);

  // Attempt state
  readonly activeAttempt = signal<Attempt | null>(null);
  readonly showModeSelector = signal(true);
  readonly submitting = signal(false);

  /**
   * Lưu đáp án học sinh theo questionId.
   */
  readonly selectedAnswers = signal<Record<string, any>>({});
  readonly showHints = signal<Record<string, boolean>>({});

  ngOnInit() {
    this.lessonsService.getBySlug(this.slug()).subscribe({
      next: (res) => {
        this.lesson.set(res.data);
        this.loading.set(false);
        if (res.data) {
          this.breadcrumbService.setLabel('lessons/:slug', res.data.title);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  async startAttempt(mode: AttemptMode): Promise<void> {
    const lesson = this.lesson();
    if (!lesson) return;

    if (mode === 'MOCK_EXAM') {
      const confirmed = await this.confirmService.confirm({
        title: $localize`Bắt đầu thi thử`,
        message: $localize`Chế độ thi thử sẽ giới hạn thời gian trong ${lesson.timeLimitSec! / 60} phút và chỉ có thể làm ${lesson.maxAttempts || 1} lần. Bạn đã sẵn sàng?`,
        confirmText: $localize`Bắt đầu ngay`,
      });
      if (!confirmed) return;
    }

    this.attemptsService.startAttempt({ lessonId: lesson.id, mode }).subscribe({
      next: (res) => {
        this.activeAttempt.set(res.data);
        this.showModeSelector.set(false);
        this.toastService.success($localize`Đã bắt đầu lượt làm bài: ${mode}`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Không thể bắt đầu làm bài`));
      },
    });
  }

  selectAnswer(questionId: string, value: any): void {
    this.selectedAnswers.update((prev) => ({ ...prev, [questionId]: value }));
  }

  toggleMultipleAnswer(questionId: string, optionId: string): void {
    this.selectedAnswers.update((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: updated };
    });
  }

  saveDrawing(questionId: string, imageData: string): void {
    this.selectedAnswers.update((prev) => ({ ...prev, [questionId]: imageData }));
  }

  toggleHint(questionId: string): void {
    this.showHints.update((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }

  submitAnswers(): void {
    const attempt = this.activeAttempt();
    if (!attempt) return;

    this.submitting.set(true);
    const answers = Object.entries(this.selectedAnswers()).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    this.attemptsService.submitAttempt(attempt.id, { answers }).subscribe({
      next: (res) => {
        this.toastService.success($localize`Nộp bài thành công!`);
        this.router.navigate(['/lessons', this.slug(), 'result', res.data.id]);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Nộp bài thất bại`));
        this.submitting.set(false);
      },
    });
  }

  difficultyLabel(d: string): string {
    const labels: Record<string, string> = {
      EASY: $localize`Dễ`,
      MEDIUM: $localize`Trung bình`,
      HARD: $localize`Khó`,
      ADVANCED: $localize`Nâng cao`,
    };
    return labels[d] ?? d;
  }

  hasDrawingAnswer(questionId: string): boolean {
    const ans = this.selectedAnswers()[questionId];
    return Boolean(typeof ans === 'string' && ans.startsWith('data:image/'));
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
