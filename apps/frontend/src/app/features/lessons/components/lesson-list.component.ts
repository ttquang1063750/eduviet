import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LessonsService } from '../../../core/services/lessons.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import type { LessonListItem } from '@eduviet/shared-types';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-list.component.html',
  styleUrl: './lesson-list.component.scss',
})
export class LessonListComponent implements OnInit {
  private lessonsService = inject(LessonsService);
  private fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly lessons = signal<LessonListItem[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly grades = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    grade: [''],
    difficulty: [''],
  });

  ngOnInit() {
    this.loadLessons();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadLessons();
      });
  }

  loadLessons() {
    this.loading.set(true);
    const { search, grade, difficulty } = this.filterForm.getRawValue();

    this.lessonsService
      .getAll({
        page: this.page(),
        perPage: 9,
        search: search || undefined,
        grade: grade ? parseInt(grade) : undefined,
        difficulty: difficulty || undefined,
      })
      .subscribe({
        next: (res) => {
          this.lessons.set(res.data);
          this.totalPages.set(res.meta.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadLessons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
