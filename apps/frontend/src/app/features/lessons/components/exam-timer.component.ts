import { Component, input, output, signal, computed, ChangeDetectionStrategy, effect, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-exam-timer',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exam-timer.component.html',
  styleUrl: './exam-timer.component.scss',
})
export class ExamTimerComponent implements OnInit, OnDestroy {
  readonly timeLimitSec = input.required<number>();
  readonly timeUp = output<void>();

  readonly timeLeft = signal(0);
  readonly isWarning = computed(() => this.timeLeft() < 60);
  readonly formattedTime = computed(() => {
    const total = this.timeLeft();
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  });

  private intervalId: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect(() => {
      this.timeLeft.set(this.timeLimitSec());
    });
  }

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      this.timeLeft.update((t) => {
        if (t <= 1) {
          this.stopTimer();
          this.timeUp.emit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
