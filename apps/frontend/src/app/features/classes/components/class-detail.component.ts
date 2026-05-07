import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ClassesService, ClassDetail } from '../../../core/services/classes.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './class-detail.component.html',
  styleUrl: './class-detail.component.scss',
})
export class ClassDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classesService = inject(ClassesService);
  private breadcrumbService = inject(BreadcrumbService);

  readonly loading = signal(true);
  readonly cls = signal<ClassDetail | null>(null);
  readonly error = signal<string | null>(null);

  readonly studentCount = computed(() => this.cls()?._count.enrollments ?? 0);
  readonly students = computed(() =>
    this.cls()?.enrollments.filter((e) => e.user.role === 'STUDENT') ?? []
  );

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id')!;
        this.loading.set(true);
        return this.classesService.getById(id);
      })
    ).subscribe({
      next: (res) => {
        this.cls.set(res.data);
        this.breadcrumbService.setLabel('classes/:id', res.data.name);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không thể tải thông tin lớp học.');
        this.loading.set(false);
      },
    });
  }
}
