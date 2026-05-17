import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import type { Lesson, LessonQuestion, Question } from '@eduviet/shared-types';
import { QuestionsService } from '../../../../core/services/questions.service';
import { LessonsService } from '../../../../core/services/lessons.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error';
import { QuestionFormComponent } from './question-form/question-form.component';
import { QuestionBankPickerComponent } from './question-bank-picker/question-bank-picker.component';
import { MatTooltipModule } from '@angular/material/tooltip';

type PanelMode = 'list' | 'create' | 'edit' | 'generate';

@Component({
  selector: 'app-exercise-editor',
  standalone: true,
  imports: [DragDropModule, QuestionFormComponent, QuestionBankPickerComponent, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exercise-editor.component.html',
  styleUrl: './exercise-editor.component.scss',
})
export class ExerciseEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionsService = inject(QuestionsService);
  private lessonsService = inject(LessonsService);
  private toastService = inject(ToastService);

  readonly lessonId = signal<string>('');
  readonly lesson = signal<Lesson | null>(null);
  readonly lessonQuestions = signal<LessonQuestion[]>([]);
  readonly selectedQuestion = signal<Question | null>(null);
  readonly panelMode = signal<PanelMode>('list');
  readonly showPicker = signal(false);
  readonly loading = signal(false);
  readonly isSaving = signal(false);

  // Generate dialog state
  readonly showGenerate = signal(false);
  readonly generateKeyword = signal('');
  readonly generateCount = signal(5);
  readonly generateType = signal<string>('');
  readonly generatedDrafts = signal<Question[]>([]);
  readonly selectedDraftIds = signal<Set<string>>(new Set());
  readonly isGenerating = signal(false);

  readonly randomizeQuestions = computed(() => (this.lesson() as (Lesson & { randomizeQuestions?: boolean }) | null)?.randomizeQuestions ?? false);
  readonly existingQuestionIds = computed(() => new Set(this.lessonQuestions().map((lq) => lq.questionId)));

  readonly questionTypes = [
    { value: '', label: $localize`Tất cả loại` },
    { value: 'SINGLE_CHOICE', label: $localize`Một đáp án` },
    { value: 'MULTIPLE_CHOICE', label: $localize`Nhiều đáp án` },
    { value: 'FILL_IN_BLANK', label: $localize`Điền vào chỗ trống` },
    { value: 'SHORT_ANSWER', label: $localize`Trả lời ngắn` },
    { value: 'ESSAY', label: $localize`Tự luận` },
    { value: 'DRAWING', label: $localize`Vẽ / Sơ đồ` },
  ];

  readonly questionTypeLabels: Record<string, string> = {
    SINGLE_CHOICE: $localize`Một đáp án`,
    MULTIPLE_CHOICE: $localize`Nhiều đáp án`,
    FILL_IN_BLANK: $localize`Điền vào ô trống`,
    SHORT_ANSWER: $localize`Trả lời ngắn`,
    ESSAY: $localize`Tự luận`,
    DRAWING: $localize`Vẽ / Sơ đồ`,
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.lessonId.set(id);
    this.loadData();
  }

  private loadData() {
    const id = this.lessonId();
    if (!id) return;

    this.loading.set(true);

    this.lessonsService.getById(id).subscribe({
      next: (res) => {
        this.lesson.set(res.data as unknown as Lesson);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Không thể tải bài học`));
        this.loading.set(false);
      },
    });

    this.questionsService.getLessonQuestions(id).subscribe({
      next: (res) => this.lessonQuestions.set(res.data),
      error: (err: unknown) => this.toastService.error(getApiErrorMessage(err, $localize`Không thể tải danh sách câu hỏi`)),
    });
  }

  // ─── Panel actions ──────────────────────────────────────────────────────────

  openCreateForm() {
    this.selectedQuestion.set(null);
    this.panelMode.set('create');
  }

  openEditForm(q: Question) {
    this.selectedQuestion.set(q);
    this.panelMode.set('edit');
  }

  closePanel() {
    this.panelMode.set('list');
    this.selectedQuestion.set(null);
  }

  openPicker() {
    this.showPicker.set(true);
  }

  closePicker() {
    this.showPicker.set(false);
  }

  openGenerate() {
    this.generateKeyword.set('');
    this.generateCount.set(5);
    this.generateType.set('');
    this.generatedDrafts.set([]);
    this.selectedDraftIds.set(new Set());
    this.showGenerate.set(true);
  }

  closeGenerate() {
    this.showGenerate.set(false);
  }

  // ─── Question form callbacks ────────────────────────────────────────────────

  onQuestionSaved(question: Question) {
    const lessonId = this.lessonId();
    this.isSaving.set(true);

    if (this.panelMode() === 'create') {
      // New question — link to lesson
      this.questionsService.addToLesson(lessonId, question.id).subscribe({
        next: (res) => {
          this.lessonQuestions.update((lqs) => [...lqs, res.data]);
          this.toastService.success($localize`Đã thêm câu hỏi vào bài học`);
          this.closePanel();
          this.isSaving.set(false);
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err, $localize`Thêm câu hỏi thất bại`));
          this.isSaving.set(false);
        },
      });
    } else {
      // Edit — update in-place
      this.lessonQuestions.update((lqs) =>
        lqs.map((lq) => (lq.question.id === question.id ? { ...lq, question } : lq)),
      );
      this.toastService.success($localize`Đã cập nhật câu hỏi`);
      this.closePanel();
      this.isSaving.set(false);
    }
  }

  // ─── Bank picker callbacks ──────────────────────────────────────────────────

  onQuestionsAdded(questions: Question[]) {
    const lessonId = this.lessonId();
    this.isSaving.set(true);

    const adds = questions.map((q) =>
      this.questionsService.addToLesson(lessonId, q.id),
    );

    let done = 0;
    adds.forEach((obs) => {
      obs.subscribe({
        next: (res) => {
          this.lessonQuestions.update((lqs) => [...lqs, res.data]);
          done++;
          if (done === adds.length) {
            this.toastService.success($localize`Đã thêm ${done} câu hỏi vào bài học`);
            this.closePicker();
            this.isSaving.set(false);
          }
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err, $localize`Thêm câu hỏi thất bại`));
          this.isSaving.set(false);
        },
      });
    });
  }

  // ─── Drag and drop ──────────────────────────────────────────────────────────

  onDrop(event: CdkDragDrop<LessonQuestion[]>) {
    if (this.randomizeQuestions()) return;

    const lqs = [...this.lessonQuestions()];
    moveItemInArray(lqs, event.previousIndex, event.currentIndex);
    this.lessonQuestions.set(lqs);

    const orderedIds = lqs.map((lq) => lq.questionId);
    this.questionsService.reorder(this.lessonId(), orderedIds).subscribe({
      error: (err: unknown) => this.toastService.error(getApiErrorMessage(err)),
    });
  }

  // ─── Remove question ────────────────────────────────────────────────────────

  removeQuestion(questionId: string) {
    this.questionsService.removeFromLesson(this.lessonId(), questionId).subscribe({
      next: () => {
        this.lessonQuestions.update((lqs) => lqs.filter((lq) => lq.questionId !== questionId));
        this.toastService.success($localize`Đã gỡ câu hỏi khỏi bài học`);
        if (this.selectedQuestion()?.id === questionId) {
          this.closePanel();
        }
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Gỡ câu hỏi thất bại`));
      },
    });
  }

  // ─── Randomize toggle ───────────────────────────────────────────────────────

  toggleRandomize() {
    const newValue = !this.randomizeQuestions();
    this.questionsService.setRandomize(this.lessonId(), newValue).subscribe({
      next: () => {
        this.lesson.update((l) => l ? ({ ...l, randomizeQuestions: newValue } as unknown as Lesson) : l);
        this.toastService.success(newValue ? $localize`Đã bật câu hỏi ngẫu nhiên` : $localize`Đã tắt câu hỏi ngẫu nhiên`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Cập nhật thất bại`));
      },
    });
  }

  // ─── AI Generate ────────────────────────────────────────────────────────────

  runGenerate() {
    const keyword = this.generateKeyword().trim();
    if (!keyword) {
      this.toastService.error($localize`Nhập từ khóa để tạo câu hỏi`);
      return;
    }

    const lesson = this.lesson();
    if (!lesson) return;

    this.isGenerating.set(true);
    this.questionsService
      .generate({
        keyword,
        subjectId: lesson.subject.id,
        count: this.generateCount(),
        type: (this.generateType() || undefined) as import('@eduviet/shared-types').QuestionType | undefined,
      })
      .subscribe({
        next: (res) => {
          this.generatedDrafts.set(res.data);
          this.selectedDraftIds.set(new Set(res.data.map((_, i) => String(i))));
          this.isGenerating.set(false);
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err));
          this.isGenerating.set(false);
        },
      });
  }

  toggleDraftSelection(index: number) {
    this.selectedDraftIds.update((ids) => {
      const newIds = new Set(ids);
      const key = String(index);
      if (newIds.has(key)) {
        newIds.delete(key);
      } else {
        newIds.add(key);
      }
      return newIds;
    });
  }

  isDraftSelected(index: number) {
    return this.selectedDraftIds().has(String(index));
  }

  addSelectedDrafts() {
    const drafts = this.generatedDrafts();
    const lesson = this.lesson();
    if (!lesson) return;

    const selected = drafts.filter((_, i) => this.isDraftSelected(i));
    if (!selected.length) {
      this.toastService.error($localize`Chưa chọn câu hỏi nào`);
      return;
    }

    this.isSaving.set(true);
    const lessonId = this.lessonId();
    let savedCount = 0;

    selected.forEach((draft) => {
      this.questionsService.create({
        ...draft,
        subjectId: lesson.subject.id,
        options: draft.options ?? undefined,
        explanation: draft.explanation ?? undefined,
        difficulty: draft.difficulty ?? undefined,
      }).subscribe({
        next: (res) => {
          this.questionsService.addToLesson(lessonId, res.data.id).subscribe({
            next: (linkRes) => {
              this.lessonQuestions.update((lqs) => [...lqs, linkRes.data]);
              savedCount++;
              if (savedCount === selected.length) {
                this.toastService.success($localize`Đã thêm ${savedCount} câu hỏi vào bài học`);
                this.closeGenerate();
                this.isSaving.set(false);
              }
            },
            error: (err: unknown) => {
              this.toastService.error(getApiErrorMessage(err, $localize`Thêm câu hỏi thất bại`));
              this.isSaving.set(false);
            },
          });
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err, $localize`Tạo câu hỏi thất bại`));
          this.isSaving.set(false);
        },
      });
    });
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  goBack() {
    void this.router.navigate(['/admin/lessons', this.lessonId(), 'edit']);
  }
}
