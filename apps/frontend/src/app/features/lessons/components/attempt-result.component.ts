import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { AttemptsService } from '../../../core/services/attempts.service';
import type { AttemptResult, AttemptAnswer } from '@eduviet/shared-types';

@Component({
  selector: 'app-attempt-result',
  standalone: true,
  imports: [RouterLink, DatePipe, MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attempt-result.component.html',
  styleUrl: './attempt-result.component.scss',
})
export class AttemptResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private attemptsService = inject(AttemptsService);

  readonly loading = signal(true);
  readonly result = signal<AttemptResult | null>(null);

  readonly scorePercentage = computed(() => {
    const res = this.result();
    if (!res || res.totalScore === null || !res.maxScore) return 0;
    return Math.round((res.totalScore / res.maxScore) * 100);
  });

  ngOnInit() {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      this.attemptsService.getResult(attemptId).subscribe({
        next: (res) => {
          this.result.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  getOptionLabel(index: number): string {
    return 'ABCD'[index] || '';
  }

  isCorrect(answer: AttemptAnswer): boolean {
    return answer.isCorrect === true;
  }

  isIncorrect(answer: AttemptAnswer): boolean {
    return answer.isCorrect === false;
  }

  isPending(answer: AttemptAnswer): boolean {
    return answer.isCorrect === null;
  }

  /** Chuyển correctAnswer (string | string[]) sang string cho markdown */
  toMarkdownString(value: string | string[] | null | undefined): string | null {
    if (value == null) return null;
    return Array.isArray(value) ? value.join(', ') : value;
  }
}
