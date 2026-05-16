import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ClassesService, ClassDetail } from '../../../core/services/classes.service';
import { SchoolsService } from '../../../core/services/schools.service';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { User } from '@eduviet/shared-types';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type Enrollment = ClassDetail['enrollments'][number];

@Component({
  selector: 'app-school-class-students',
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
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-class-students.component.html',
  styleUrl: './school-class-students.component.scss',
})
export class SchoolClassStudentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classesService = inject(ClassesService);
  private schoolsService = inject(SchoolsService);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['avatar', 'name', 'email', 'actions'];

  schoolId = signal<string>('');
  classId = signal<string>('');
  schoolName = signal<string>('');
  className = signal<string>('');

  enrollments = signal<Enrollment[]>([]);
  loadingEnrollments = signal(false);

  /** IDs đã enroll — dùng để lọc search results */
  enrolledIds = computed(() => new Set(this.enrollments().map((e) => e.user.id)));

  /** Panel thêm học sinh */
  showAddPanel = signal(false);
  searchControl = new FormControl('');
  searchResults = signal<User[]>([]);
  searching = signal(false);
  loadingMore = signal(false);
  hasMore = signal(false);
  enrollingId = signal<string | null>(null);
  removingId = signal<string | null>(null);

  private readonly PER_PAGE = 10;
  private searchPage = 1;
  private searchSubject = new Subject<string>();

  backUrl(): string[] {
    return ['/admin/schools', this.schoolId(), 'classes', this.classId()];
  }

  classesUrl(): string[] {
    return ['/admin/schools', this.schoolId(), 'classes'];
  }

  ngOnInit(): void {
    const schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    const classId = this.route.snapshot.paramMap.get('classId') ?? '';
    this.schoolId.set(schoolId);
    this.classId.set(classId);

    // Load tên trường + tên lớp cho breadcrumb
    if (schoolId) {
      this.schoolsService
        .findById(schoolId)
        .subscribe({ next: (s) => this.schoolName.set(s.name) });
    }

    // Load enrollments
    this.loadEnrollments();

    // Search debounce
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => this.runSearch(term));

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.searchSubject.next(v ?? ''));
  }

  // ─── Enrollments ─────────────────────────────────────────────────────────

  loadEnrollments(): void {
    this.loadingEnrollments.set(true);
    this.classesService.getById(this.classId()).subscribe({
      next: (res) => {
        this.className.set(res.data.name);
        this.enrollments.set(res.data.enrollments ?? []);
        this.loadingEnrollments.set(false);
      },
      error: () => this.loadingEnrollments.set(false),
    });
  }

  async onRemove(enrollment: Enrollment): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Xóa học sinh khỏi lớp',
      message: `Xóa ${enrollment.user.fullName} khỏi lớp này?`,
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (!confirmed) return;

    this.removingId.set(enrollment.user.id);
    this.classesService.unenroll(this.classId(), enrollment.user.id).subscribe({
      next: () => {
        this.enrollments.update((list) =>
          list.filter((e) => e.user.id !== enrollment.user.id),
        );
        this.toastService.success(`Đã xóa ${enrollment.user.fullName} khỏi lớp`);
        this.removingId.set(null);
        // Refresh search results nếu panel đang mở
        if (this.showAddPanel()) {
          this.runSearch(this.searchControl.value ?? '');
        }
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xóa học sinh thất bại'));
        this.removingId.set(null);
      },
    });
  }

  // ─── Add Student Panel ───────────────────────────────────────────────────

  toggleAddPanel(): void {
    this.showAddPanel.update((v) => !v);
    if (this.showAddPanel()) {
      this.searchPage = 1;
      this.runSearch('');
    } else {
      this.searchControl.setValue('', { emitEvent: false });
      this.searchResults.set([]);
      this.hasMore.set(false);
    }
  }

  private runSearch(term: string): void {
    this.searchPage = 1;
    this.searchResults.set([]);
    this.hasMore.set(false);
    this.fetchStudents(term, false);
  }

  private fetchStudents(term: string, append: boolean): void {
    if (append) {
      this.loadingMore.set(true);
    } else {
      this.searching.set(true);
    }

    this.usersService
      .getAll({
        role: 'STUDENT',
        search: term || undefined,
        page: this.searchPage,
        perPage: this.PER_PAGE,
      })
      .subscribe({
        next: (res) => {
          const filtered = res.data.filter((u) => !this.enrolledIds().has(u.id));
          if (append) {
            this.searchResults.update((prev) => [...prev, ...filtered]);
          } else {
            this.searchResults.set(filtered);
          }
          this.hasMore.set(this.searchPage < res.meta.totalPages);
          this.searching.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.searching.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  onSearchScroll(event: Event): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
      this.searchPage += 1;
      this.fetchStudents(this.searchControl.value ?? '', true);
    }
  }

  onEnroll(student: User): void {
    this.enrollingId.set(student.id);
    this.classesService.enroll(this.classId(), student.id).subscribe({
      next: () => {
        this.enrollments.update((prev) => [
          ...prev,
          {
            id: '',
            user: {
              id: student.id,
              fullName: student.fullName,
              email: student.email,
              avatarUrl: student.avatarUrl ?? null,
              roles: student.roles as string[],
            },
            createdAt: new Date().toISOString(),
          },
        ]);
        this.searchResults.update((prev) =>
          prev.filter((u) => u.id !== student.id),
        );
        this.enrollingId.set(null);
        this.toastService.success(`Đã thêm ${student.fullName} vào lớp`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Thêm học sinh thất bại'));
        this.enrollingId.set(null);
      },
    });
  }

  trackByUserId(_index: number, enrollment: Enrollment): string {
    return enrollment.user.id;
  }

  trackById(_index: number, user: User): string {
    return user.id;
  }
}
