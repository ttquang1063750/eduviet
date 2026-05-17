import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Question } from '@eduviet/shared-types';
import { QuestionsService } from '../../../../core/services/questions.service';
import { SubjectsService } from '../../../../core/services/subjects.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error';
import { QuestionFormComponent } from '../../lessons/exercise-editor/question-form/question-form.component';

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [RouterLink, QuestionFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-editor.component.html',
  styleUrl: './question-editor.component.scss',
})
export class QuestionEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionsService = inject(QuestionsService);
  private subjectsService = inject(SubjectsService);
  private toastService = inject(ToastService);

  readonly question = signal<Question | null>(null);
  readonly subjects = signal<{ id: string; name: string }[]>([]);
  readonly loading = signal(false);
  readonly subjectId = signal('');
  readonly isEdit = signal(false);

  ngOnInit() {
    this.loadSubjects();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.loadQuestion(id);
    } else {
      // Check query params for subjectId if any
      const sId = this.route.snapshot.queryParamMap.get('subjectId');
      if (sId) this.subjectId.set(sId);
    }
  }

  private loadSubjects() {
    this.subjectsService.list().subscribe({
      next: (list) => this.subjects.set(list),
    });
  }

  private loadQuestion(id: string) {
    this.loading.set(true);
    this.questionsService.getById(id).subscribe({
      next: (response) => {
        this.question.set(response.data);
        this.subjectId.set(response.data.subjectId ?? '');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Không thể tải thông tin câu hỏi`));
        this.router.navigate(['/admin/questions']);
      },
    });
  }

  onSaved(_q: Question) {
    this.toastService.success(
      this.isEdit() ? $localize`Đã cập nhật câu hỏi` : $localize`Đã tạo câu hỏi mới`
    );
    this.router.navigate(['/admin/questions']);
  }

  onCancelled() {
    this.router.navigate(['/admin/questions']);
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
