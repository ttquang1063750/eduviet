import { Component, inject, signal, input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonsService } from '../../../core/services/lessons.service';
import type { Lesson } from '@eduviet/shared-types';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-detail.component.html',
  styleUrl: './lesson-detail.component.scss',
})
export class LessonDetailComponent implements OnInit {
  private lessonsService = inject(LessonsService);

  readonly slug = input.required<string>();
  readonly loading = signal(true);
  readonly lesson = signal<Lesson | null>(null);
  readonly selectedAnswers = signal<Record<string, string>>({});
  readonly showHints = signal<Record<string, boolean>>({});

  ngOnInit() {
    this.lessonsService.getBySlug(this.slug()).subscribe({
      next: (res) => {
        this.lesson.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectAnswer(exerciseId: string, value: string) {
    this.selectedAnswers.update((prev) => ({ ...prev, [exerciseId]: value }));
  }

  toggleHint(exerciseId: string) {
    this.showHints.update((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }

  submitAnswers() {
    const answered = Object.keys(this.selectedAnswers()).length;
    const total = this.lesson()?.exercises.length ?? 0;
    alert(
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
}
