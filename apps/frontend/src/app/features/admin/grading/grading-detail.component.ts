import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MarkdownComponent } from 'ngx-markdown';
import { AttemptsService } from '../../../core/services/attempts.service';
import { ToastService } from '../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import type { AttemptResult, AttemptAnswer } from '@eduviet/shared-types';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-grading-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatProgressSpinnerModule, ReactiveFormsModule, MarkdownComponent, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grading-detail.component.html',
  styleUrl: './grading-detail.component.scss',
})
export class GradingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attemptsService = inject(AttemptsService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly attempt = signal<AttemptResult | null>(null);
  readonly isSaving = signal(false);

  // Forms for each pending answer
  readonly gradingForms = signal<Record<string, FormGroup>>({});

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('attemptId');
    if (id) {
      this.attemptsService.getResult(id).subscribe({
        next: (res) => {
          this.attempt.set(res.data);
          this.initForms(res.data.answers);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.toast.error(getApiErrorMessage(err, $localize`Không thể tải thông tin bài làm`));
          this.router.navigate(['/admin/grading']);
        },
      });
    }
  }

  private initForms(answers: AttemptAnswer[]) {
    const forms: Record<string, FormGroup> = {};
    answers.filter(a => a.isCorrect === null).forEach(a => {
      forms[a.id] = this.fb.nonNullable.group({
        score: [a.score ?? 0, [Validators.required, Validators.min(0), Validators.max(a.question?.points ?? 100)]],
        feedback: [a.feedback ?? ''],
      });
    });
    this.gradingForms.set(forms);
  }

  getPendingAnswers(): AttemptAnswer[] {
    return this.attempt()?.answers.filter(a => a.isCorrect === null) ?? [];
  }

  submitGrade(answerId: string) {
    const form = this.gradingForms()[answerId];
    if (form.invalid) return;

    this.isSaving.set(true);
    this.attemptsService.gradeAnswer(this.attempt()!.id, answerId, form.value).subscribe({
      next: () => {
        this.toast.success($localize`Đã lưu điểm cho câu hỏi`);
        this.isSaving.set(false);
        // Refresh detail to see if fully graded
        this.ngOnInit();
      },
      error: (err: unknown) => {
        this.toast.error(getApiErrorMessage(err, $localize`Chấm điểm thất bại`));
        this.isSaving.set(false);
      },
    });
  }

  isDrawing(ans: AttemptAnswer): boolean {
    return ans.question?.type === 'DRAWING';
  }
}
