import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, KeyValuePipe } from '@angular/common';
import type { LessonListItem } from '@eduviet/shared-types';
import { LessonsService } from '../../../../core/services/lessons.service';
import { SubjectsService } from '../../../../core/services/subjects.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-lesson-admin-list',
  standalone: true,
  imports: [FormsModule, DatePipe, KeyValuePipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-admin-list.component.html',
  styleUrl: './lesson-admin-list.component.scss',
})
export class LessonAdminListComponent implements OnInit {
  private lessonsService = inject(LessonsService);
  private subjectsService = inject(SubjectsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);

  readonly lessons = signal<LessonListItem[]>([]);
  readonly subjects = signal<{ id: string; name: string; code: string }[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = 10;

  // Filters
  readonly filterSearch = signal('');
  readonly filterSubject = signal('');
  readonly filterGrade = signal<number | ''>('');
  readonly filterStatus = signal('');

  readonly totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  readonly statusLabels: Record<string, string> = {
    DRAFT: 'Bản nháp',
    IN_REVIEW: 'Đang chờ duyệt',
    APPROVED: 'Đã duyệt',
    PUBLISHED: 'Đã xuất bản',
    REJECTED: 'Bị từ chối',
    ARCHIVED: 'Lưu trữ',
  };

  ngOnInit() {
    this.loadSubjects();
    this.loadLessons();
  }

  private loadSubjects() {
    this.subjectsService.list().subscribe({
      next: (list) => this.subjects.set(list),
    });
  }

  loadLessons() {
    this.loading.set(true);
    this.lessonsService
      .getAll({
        page: this.page(),
        perPage: this.perPage,
        search: this.filterSearch() || undefined,
        subject: this.filterSubject() || undefined,
        grade: this.filterGrade() === '' ? undefined : (this.filterGrade() as number),
        status: this.filterStatus() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.lessons.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applyFilters() {
    this.page.set(1);
    this.loadLessons();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadLessons();
  }

  openCreate() {
    this.router.navigate(['/admin/lessons/new']);
  }

  openEdit(lesson: LessonListItem) {
    this.router.navigate(['/admin/lessons', lesson.id, 'edit']);
  }

  openExercises(lesson: LessonListItem) {
    this.router.navigate(['/admin/lessons', lesson.id, 'exercises']);
  }

  async submitReview(lesson: LessonListItem) {
    const confirmed = await this.confirmService.confirm({
      title: 'Gửi duyệt',
      message: 'Bạn có chắc muốn gửi bài học này đi duyệt?',
      confirmText: 'Gửi duyệt',
    });
    if (!confirmed) return;

    this.lessonsService.submitReview(lesson.id).subscribe({
      next: () => {
        this.toastService.success('Đã gửi duyệt bài học');
        this.loadLessons();
      },
      error: (err: unknown) => this.toastService.error(getApiErrorMessage(err)),
    });
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
