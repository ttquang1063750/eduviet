import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttemptsService } from '../../../../core/services/attempts.service';

interface PendingAttempt {
  id: string;
  status: string;
  submittedAt: string | null;
  student: { fullName: string; email: string };
  lesson: { title: string };
  _count: { answers: number };
}
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-grading-queue',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
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

  ngOnInit() {
    this.loadQueue();
  }

  loadQueue() {
    this.loading.set(true);
    this.attemptsService.getPendingGrading(this.page(), this.perPage).subscribe({
      next: (res) => {
        this.queue.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(p: number) {
    this.page.set(p);
    this.loadQueue();
  }
}
