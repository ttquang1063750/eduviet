import { Component, inject, signal, input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { LessonsService } from '../../../core/services/lessons.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ToastService } from '../../../core/services/toast.service';
import { DrawingCanvasComponent } from '../../../shared/components/drawing-canvas/drawing-canvas.component';
import type { Lesson } from '@eduviet/shared-types';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [RouterLink, MarkdownComponent, DrawingCanvasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-detail.component.html',
  styleUrl: './lesson-detail.component.scss',
})
export class LessonDetailComponent implements OnInit {
  private lessonsService = inject(LessonsService);
  private breadcrumbService = inject(BreadcrumbService);
  private toastService = inject(ToastService);

  readonly slug = input.required<string>();
  readonly loading = signal(true);
  readonly lesson = signal<Lesson | null>(null);
  /**
   * Lưu đáp án học sinh theo exerciseId.
   * - MULTIPLE_CHOICE / FILL_IN_BLANK / SHORT_ANSWER: string value
   * - DRAWING: base64 PNG string (từ DrawingCanvasComponent.imageExported)
   */
  readonly selectedAnswers = signal<Record<string, string>>({});
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

  selectAnswer(exerciseId: string, value: string): void {
    this.selectedAnswers.update((prev) => ({ ...prev, [exerciseId]: value }));
  }

  /** Nhận base64 PNG từ canvas vẽ hình và lưu vào selectedAnswers */
  saveDrawing(exerciseId: string, imageData: string): void {
    this.selectedAnswers.update((prev) => ({ ...prev, [exerciseId]: imageData }));
  }

  toggleHint(exerciseId: string): void {
    this.showHints.update((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }

  submitAnswers(): void {
    const answered = Object.keys(this.selectedAnswers()).length;
    const total = this.lesson()?.exercises.length ?? 0;
    // TODO: Thay bằng API call khi hệ thống chấm điểm sẵn sàng
    this.toastService.info(
      `Đã nộp ${answered}/${total} câu trả lời!\n(Chức năng chấm điểm sẽ được tích hợp trong phiên bản đầy đủ)`
    );
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

  hasDrawingAnswer(exerciseId: string): boolean {
    const ans = this.selectedAnswers()[exerciseId];
    return Boolean(ans?.startsWith('data:image/'));
  }
}
