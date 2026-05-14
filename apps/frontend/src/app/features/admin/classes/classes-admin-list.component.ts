import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ClassesService, ClassItem } from '../../../core/services/classes.service';
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
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-classes-admin-list',
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
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './classes-admin-list.component.html',
  styleUrl: './classes-admin-list.component.scss',
})
export class ClassesAdminListComponent implements OnInit {
  private classesService = inject(ClassesService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);

  readonly displayedColumns = ['name', 'grade', 'school', 'academicYear', 'students', 'actions'];

  classes = signal<ClassItem[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 10;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));
  loading = signal(false);

  searchControl = new FormControl('');

  ngOnInit(): void {
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
        page: this.page(),
        perPage: this.perPage,
        search: this.searchControl.value || undefined,
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

  /** Navigate đến edit class trong context của trường (school-scoped URL) */
  onEdit(cls: ClassItem): void {
    void this.router.navigate([
      '/admin/schools',
      cls.school.id,
      'classes',
      cls.id,
    ]);
  }

  /** Navigate đến students list */
  onViewStudents(cls: ClassItem): void {
    void this.router.navigate([
      '/admin/schools',
      cls.school.id,
      'classes',
      cls.id,
      'students',
    ]);
  }

  async onDelete(cls: ClassItem): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Xóa lớp học',
      message: `Xóa lớp "${cls.name}" (${cls.school.name})? Thao tác không thể hoàn tác.`,
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (!confirmed) return;

    this.classesService.delete(cls.id).subscribe({
      next: () => {
        this.classes.update((list) => list.filter((c) => c.id !== cls.id));
        this.total.update((t) => t - 1);
        this.toastService.success('Đã xóa lớp học');
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xóa thất bại'));
      },
    });
  }

  trackById(_index: number, cls: ClassItem): string {
    return cls.id;
  }
}
