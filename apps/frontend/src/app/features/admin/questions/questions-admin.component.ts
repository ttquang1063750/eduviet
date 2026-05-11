import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type { Question } from '@eduviet/shared-types';
import { QuestionsService } from '../../../core/services/questions.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { QuestionFormComponent } from '../lessons/exercise-editor/question-form/question-form.component';

@Component({
  selector: 'app-questions-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, QuestionFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './questions-admin.component.html',
  styleUrl: './questions-admin.component.scss',
})
export class QuestionsAdminComponent implements OnInit {
  private questionsService = inject(QuestionsService);
  private subjectsService = inject(SubjectsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

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

  // Modal state
  readonly showModal = signal(false);
  readonly editingQuestion = signal<Question | null>(null);
  readonly modalSubjectId = signal('');
  readonly isSaving = signal(false);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  readonly subjectMap = computed(() => {
    const map: Record<string, string> = {};
    for (const s of this.subjects()) map[s.id] = s.name;
    return map;
  });

  readonly questionTypeLabels: Record<string, string> = {
    SINGLE_CHOICE: 'Một đáp án',
    MULTIPLE_CHOICE: 'Nhiều đáp án',
    FILL_IN_BLANK: 'Điền chỗ trống',
    SHORT_ANSWER: 'Trả lời ngắn',
    ESSAY: 'Tự luận',
    DRAWING: 'Vẽ / Sơ đồ',
  };

  readonly difficultyLabels: Record<string, string> = {
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
    this.editingQuestion.set(null);
    this.modalSubjectId.set(this.filterSubject());
    this.showModal.set(true);
  }

  openEdit(q: Question) {
    this.editingQuestion.set(q);
    this.modalSubjectId.set(q.subjectId ?? '');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingQuestion.set(null);
    this.modalSubjectId.set('');
  }

  onQuestionSaved(q: Question) {
    this.toastService.success(
      this.editingQuestion() ? 'Đã cập nhật câu hỏi' : 'Đã tạo câu hỏi mới',
    );
    this.closeModal();
    this.loadQuestions();
    this.isSaving.set(false);
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
