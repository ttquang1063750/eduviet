import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import type { Question, QuestionFilter, QuestionType } from '@eduviet/shared-types';
import { QuestionsService } from '../../../../../core/services/questions.service';
import { getApiErrorMessage } from '../../../../../core/utils/http-error';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-question-bank-picker',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-bank-picker.component.html',
  styleUrl: './question-bank-picker.component.scss',
})
export class QuestionBankPickerComponent implements OnInit {
  subjectId = input<string>('');
  existingIds = input<Set<string>>(new Set());

  added = output<Question[]>();
  closed = output<void>();

  private questionsService = inject(QuestionsService);
  private toastService = inject(ToastService);

  readonly questions = signal<Question[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly loading = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);

  // Filter state
  readonly searchQuery = signal('');
  readonly filterType = signal<string>('');
  readonly filterDifficulty = signal<string>('');

  readonly questionTypes: { value: string; label: string }[] = [
    { value: '', label: 'Tất cả loại' },
    { value: 'SINGLE_CHOICE', label: 'Một đáp án' },
    { value: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án' },
    { value: 'FILL_IN_BLANK', label: 'Điền vào ô trống' },
    { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
    { value: 'ESSAY', label: 'Tự luận' },
    { value: 'DRAWING', label: 'Vẽ / Sơ đồ' },
  ];

  readonly difficultyOptions = [
    { value: '', label: 'Tất cả độ khó' },
    { value: 'EASY', label: 'Dễ' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HARD', label: 'Khó' },
    { value: 'ADVANCED', label: 'Nâng cao' },
  ];

  readonly questionTypeLabels: Record<string, string> = {
    SINGLE_CHOICE: 'Một đáp án',
    MULTIPLE_CHOICE: 'Nhiều đáp án',
    FILL_IN_BLANK: 'Điền vào ô trống',
    SHORT_ANSWER: 'Trả lời ngắn',
    ESSAY: 'Tự luận',
    DRAWING: 'Vẽ / Sơ đồ',
  };

  readonly difficultyLabels: Record<string, string> = {
    EASY: 'Dễ',
    MEDIUM: 'TB',
    HARD: 'Khó',
    ADVANCED: 'Nâng cao',
  };

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    const filter: QuestionFilter = {
      subjectId: this.subjectId(),
      page: this.currentPage(),
      perPage: 20,
    };
    if (this.searchQuery()) filter.search = this.searchQuery();
    if (this.filterType()) filter.type = this.filterType() as QuestionType;
    if (this.filterDifficulty()) filter.difficulty = this.filterDifficulty() as never;

    this.questionsService.getBank(filter).subscribe({
      next: (res) => {
        this.questions.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.totalCount.set(res.meta.total);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  applyFilter() {
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  isAlreadyAdded(id: string) {
    return this.existingIds().has(id);
  }

  isSelected(id: string) {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: string) {
    if (this.isAlreadyAdded(id)) return;
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  selectAll() {
    const available = this.questions()
      .filter((q) => !this.isAlreadyAdded(q.id))
      .map((q) => q.id);
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      available.forEach((id) => next.add(id));
      return next;
    });
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  confirmAdd() {
    const selected = this.questions().filter((q) => this.isSelected(q.id));
    if (!selected.length) {
      this.toastService.error('Chưa chọn câu hỏi nào');
      return;
    }
    this.added.emit(selected);
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  close() {
    this.closed.emit();
  }
}
