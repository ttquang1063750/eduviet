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
import type { Question } from '@eduviet/shared-types';
import { QuestionsService } from '../../../core/services/questions.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';

import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-questions-admin',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './questions-admin.component.html',
  styleUrl: './questions-admin.component.scss',
})
export class QuestionsAdminComponent implements OnInit {
  private questionsService = inject(QuestionsService);
  private subjectsService = inject(SubjectsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);

  readonly questions = signal<Question[]>([]);
  readonly subjects = signal<{ id: string; name: string }[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = 20;

  // Filters
  readonly filterSearch = signal('');
  readonly filterSubject = signal('');
  readonly filterType = signal('');
  readonly filterDifficulty = signal('');

  readonly totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  readonly subjectMap = computed(() => {
    const map: Record<string, string | undefined> = {};
    for (const s of this.subjects()) map[s.id] = s.name;
    return map;
  });

  readonly questionTypeLabels: Record<string, string | undefined> = {
    SINGLE_CHOICE: 'Một đáp án',
    MULTIPLE_CHOICE: 'Nhiều đáp án',
    FILL_IN_BLANK: 'Điền chỗ trống',
    SHORT_ANSWER: 'Trả lời ngắn',
    ESSAY: 'Tự luận',
    DRAWING: 'Vẽ / Sơ đồ',
  };

  readonly difficultyLabels: Record<string, string | undefined> = {
    EASY: 'Dễ',
    MEDIUM: 'Trung bình',
    HARD: 'Khó',
  };

  ngOnInit() {
    this.loadSubjects();
    this.loadQuestions();
  }

  private loadSubjects() {
    this.subjectsService.list().subscribe({
      next: (list) => this.subjects.set(list),
    });
  }

  loadQuestions() {
    this.loading.set(true);
    this.questionsService
      .getBank({
        page: this.page(),
        perPage: this.perPage,
        search: this.filterSearch() || undefined,
        subjectId: this.filterSubject() || undefined,
        type: (this.filterType() as import('@eduviet/shared-types').QuestionType) || undefined,
        difficulty: (this.filterDifficulty() as import('@eduviet/shared-types').Difficulty) || undefined,
      })
      .subscribe({
        next: (res) => {
          this.questions.set(res.data);
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
    this.loadQuestions();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadQuestions();
  }

  openCreate() {
    const queryParams = this.filterSubject() ? { subjectId: this.filterSubject() } : {};
    this.router.navigate(['/admin/questions/new'], { queryParams });
  }

  openEdit(q: Question) {
    this.router.navigate(['/admin/questions', q.id, 'edit']);
  }

  async deleteQuestion(q: Question) {
    const confirmed = await this.confirmService.confirm({
      title: 'Xoá câu hỏi',
      message: `Bạn có chắc muốn xoá câu hỏi này? Hành động không thể hoàn tác.`,
      confirmText: 'Xoá',
      type: 'danger',
    });
    if (!confirmed) return;

    this.questionsService.delete(q.id).subscribe({
      next: () => {
        this.toastService.success('Đã xoá câu hỏi');
        this.loadQuestions();
      },
      error: (err: unknown) => this.toastService.error(getApiErrorMessage(err)),
    });
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
