import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { AttemptsService } from '../../../core/services/attempts.service';

interface PendingAttempt {
  id: string;
  status: string;
  submittedAt: string | null;
  student: { fullName: string; email: string };
  lesson: { title: string };
  _count: { answers: number };
}

@Component({
  selector: 'app-grading-queue',
  standalone: true,
  imports: [RouterLink, DatePipe, MatProgressSpinnerModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grading-queue.component.html',
  styleUrl: './grading-queue.component.scss',
})
export class GradingQueueComponent implements OnInit {
  private attemptsService = inject(AttemptsService);

  readonly loading = signal(true);
  readonly queue = signal<PendingAttempt[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = 20;

  readonly displayedColumns = ['student', 'lesson', 'pendingCount', 'submittedAt', 'actions'];

  ngOnInit(): void {
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading.set(true);
    this.attemptsService.getPendingGrading(this.page(), this.perPage).subscribe({
      next: (res) => {
        this.queue.set(res.data as PendingAttempt[]);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadQueue();
  }
}
