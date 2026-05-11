import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Question, CreateQuestionRequest, UpdateQuestionRequest, QuestionType } from '@eduviet/shared-types';
import { QuestionsService } from '../../../../../core/services/questions.service';
import { getApiErrorMessage } from '../../../../../core/utils/http-error';
import { ToastService } from '../../../../../core/services/toast.service';

export interface QuestionOption {
  id: string;
  text: string;
}

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.scss',
})
export class QuestionFormComponent implements OnChanges {
  @Input() question: Question | null = null;
  @Input() subjectId = '';
  @Input() isSaving = false;

  @Output() saved = new EventEmitter<Question>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private questionsService = inject(QuestionsService);
  private toastService = inject(ToastService);

  readonly saving = signal(false);
  readonly selectedType = signal<QuestionType>('SINGLE_CHOICE');

  readonly options = signal<QuestionOption[]>([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);

  readonly correctAnswerSingle = signal('a');
  readonly correctAnswerMultiple = signal<string[]>([]);
  readonly correctAnswerFillBlanks = signal<string[]>(['']);
  readonly correctAnswerText = signal('');

  readonly needsOptions = computed(() =>
    this.selectedType() === 'SINGLE_CHOICE' || this.selectedType() === 'MULTIPLE_CHOICE',
  );

  readonly questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'SINGLE_CHOICE', label: 'Một đáp án' },
    { value: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án' },
    { value: 'FILL_IN_BLANK', label: 'Điền vào chỗ trống' },
    { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
    { value: 'ESSAY', label: 'Tự luận' },
    { value: 'DRAWING', label: 'Vẽ / Sơ đồ' },
  ];

  readonly questionTypeLabels: Record<string, string> = {
    SINGLE_CHOICE: 'Một đáp án',
    MULTIPLE_CHOICE: 'Nhiều đáp án',
    FILL_IN_BLANK: 'Điền vào ô trống',
    SHORT_ANSWER: 'Trả lời ngắn',
    ESSAY: 'Tự luận',
    DRAWING: 'Vẽ / Sơ đồ',
  };

  readonly difficultyOptions = [
    { value: 'EASY', label: 'Dễ' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HARD', label: 'Khó' },
    { value: 'ADVANCED', label: 'Nâng cao' },
  ];

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(1)]],
    points: [10, [Validators.min(1), Validators.max(100)]],
    difficulty: ['MEDIUM'],
    explanation: [''],
    hints: [''],
    tags: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question']) {
      this.resetForm();
    }
  }

  private resetForm() {
    const q = this.question;
    if (q) {
      this.selectedType.set(q.type as QuestionType);
      this.form.patchValue({
        content: q.content,
        points: q.points,
        difficulty: q.difficulty ?? 'MEDIUM',
        explanation: q.explanation ?? '',
        hints: q.hints.join(', '),
        tags: q.tags.join(', '),
      });

      if (q.options && Array.isArray(q.options)) {
        this.options.set(q.options as QuestionOption[]);
      }

      if (q.type === 'SINGLE_CHOICE') {
        this.correctAnswerSingle.set(q.correctAnswer as string);
      } else if (q.type === 'MULTIPLE_CHOICE') {
        this.correctAnswerMultiple.set(q.correctAnswer as string[]);
      } else if (q.type === 'FILL_IN_BLANK') {
        const blanks = Array.isArray(q.correctAnswer) ? q.correctAnswer as string[] : [q.correctAnswer as string];
        this.correctAnswerFillBlanks.set(blanks);
      } else {
        this.correctAnswerText.set(q.correctAnswer as string);
      }
    } else {
      this.selectedType.set('SINGLE_CHOICE');
      this.form.reset({ content: '', points: 10, difficulty: 'MEDIUM', explanation: '', hints: '', tags: '' });
      this.options.set([
        { id: 'a', text: '' }, { id: 'b', text: '' },
        { id: 'c', text: '' }, { id: 'd', text: '' },
      ]);
      this.correctAnswerSingle.set('a');
      this.correctAnswerMultiple.set([]);
      this.correctAnswerFillBlanks.set(['']);
      this.correctAnswerText.set('');
    }
  }

  onTypeChange(type: string) {
    this.selectedType.set(type as QuestionType);
  }

  // ─── Options management ──────────────────────────────────────────────────────

  setOptionText(index: number, text: string) {
    this.options.update((opts) =>
      opts.map((o, i) => (i === index ? { ...o, text } : o)),
    );
  }

  addOption() {
    const ids = 'abcdefgh';
    const next = ids[this.options().length] ?? String(this.options().length);
    this.options.update((opts) => [...opts, { id: next, text: '' }]);
  }

  removeOption(index: number) {
    if (this.options().length <= 2) return;
    this.options.update((opts) => opts.filter((_, i) => i !== index));
  }

  // ─── Multiple choice correct answers ────────────────────────────────────────

  toggleMultipleAnswer(id: string) {
    this.correctAnswerMultiple.update((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  isMultipleSelected(id: string) {
    return this.correctAnswerMultiple().includes(id);
  }

  // ─── Fill-in-blank blanks ────────────────────────────────────────────────────

  addBlank() {
    this.correctAnswerFillBlanks.update((b) => [...b, '']);
  }

  removeBlank(index: number) {
    if (this.correctAnswerFillBlanks().length <= 1) return;
    this.correctAnswerFillBlanks.update((b) => b.filter((_, i) => i !== index));
  }

  setBlankAnswer(index: number, value: string) {
    this.correctAnswerFillBlanks.update((b) =>
      b.map((v, i) => (i === index ? value : v)),
    );
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  onSubmit() {
    if (this.form.invalid) return;

    const formVal = this.form.getRawValue();
    const type = this.selectedType();

    const correctAnswer = this.buildCorrectAnswer(type);
    const hints = formVal.hints
      ? formVal.hints.split(',').map((h) => h.trim()).filter(Boolean)
      : [];
    const tags = formVal.tags
      ? formVal.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload: CreateQuestionRequest & Partial<{ id: string }> = {
      subjectId: this.subjectId,
      type: type as never,
      content: formVal.content,
      correctAnswer,
      options: this.needsOptions() ? this.options() : undefined,
      explanation: formVal.explanation || undefined,
      hints,
      points: formVal.points,
      difficulty: formVal.difficulty as never,
      tags,
    };

    this.saving.set(true);

    if (this.question) {
      const updatePayload: UpdateQuestionRequest = {
        content: payload.content,
        correctAnswer: payload.correctAnswer,
        options: payload.options ?? undefined,
        explanation: payload.explanation,
        hints: payload.hints,
        points: payload.points,
        difficulty: payload.difficulty,
        tags: payload.tags,
      };
      this.questionsService.update(this.question.id, updatePayload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.saved.emit(res.data);
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err));
          this.saving.set(false);
        },
      });
    } else {
      this.questionsService.create(payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.saved.emit(res.data);
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err));
          this.saving.set(false);
        },
      });
    }
  }

  private buildCorrectAnswer(type: QuestionType): string | string[] {
    switch (type) {
      case 'SINGLE_CHOICE':
        return this.correctAnswerSingle();
      case 'MULTIPLE_CHOICE':
        return this.correctAnswerMultiple();
      case 'FILL_IN_BLANK':
        return this.correctAnswerFillBlanks();
      default:
        return this.correctAnswerText();
    }
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  onCancel() {
    this.cancelled.emit();
  }
}
