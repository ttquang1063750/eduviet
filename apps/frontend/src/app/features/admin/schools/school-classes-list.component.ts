import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ClassesService, ClassItem } from '../../../core/services/classes.service';
import { SchoolsService } from '../../../core/services/schools.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-school-classes-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-classes-list.component.html',
  styleUrl: './school-classes-list.component.scss',
})
export class SchoolClassesListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classesService = inject(ClassesService);
  private schoolsService = inject(SchoolsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  readonly displayedColumns = ['name', 'grade', 'academicYear', 'teacher', 'students', 'actions'];

  schoolId = signal<string>('');
  schoolName = signal<string>('');
  classes = signal<ClassItem[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 20;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));
  loading = signal(false);

  searchControl = new FormControl('');

  /** Base URL tương đối cho routerLink — dùng lại schoolId từ URL */
  get baseUrl(): string[] {
    return ['/admin/schools', this.schoolId()];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.schoolId.set(id);

    // Load tên trường cho breadcrumb
    if (id) {
      this.schoolsService.findById(id).subscribe({
        next: (school) => this.schoolName.set(school.name),
      });
    }

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadClasses();
      });

    this.loadClasses();
  }

  loadClasses(): void {
    this.loading.set(true);
    this.classesService
      .getAll({
        schoolId: this.schoolId(),
        page: this.page(),
        perPage: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.classes.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadClasses();
  }

  async onDelete(cls: ClassItem): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: $localize`Xóa lớp học`,
      message: $localize`Xóa lớp "${cls.name}"? Toàn bộ dữ liệu liên quan sẽ bị xóa.`,
      confirmText: $localize`Xóa`,
      type: 'danger',
    });
    if (!confirmed) return;

    this.classesService.delete(cls.id).subscribe({
      next: () => {
        this.classes.update((list) => list.filter((c) => c.id !== cls.id));
        this.total.update((t) => t - 1);
        this.toastService.success($localize`Đã xóa lớp học`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Xóa thất bại`));
      },
    });
  }

  trackById(_index: number, cls: ClassItem): string {
    return cls.id;
  }
}
