import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassesService } from '../../../core/services/classes.service';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { User } from '@eduviet/shared-types';
import { switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { getApiErrorMessage } from '../../../core/utils/http-error';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-school-class-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-class-detail.component.html',
  styleUrl: './school-class-detail.component.scss',
})
export class SchoolClassDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classesService = inject(ClassesService);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  classForm = this.fb.group({
    name: ['', Validators.required],
    grade: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
    academicYear: ['', Validators.required],
    homeroomTeacherId: [''],
  });

  /** schoolId từ route cha /:id — cố định, không thay đổi */
  schoolId = signal<string>('');
  classId = signal<string | null>(null);
  isEditMode = signal(false);
  saving = signal(false);

  /** Teacher autocomplete */
  teachers = signal<User[]>([]);
  teacherSearch = signal('');
  loadingTeachers = signal(false);
  private teacherSearchSubject = new Subject<string>();

  readonly grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  get backUrl(): string[] {
    return ['/admin/schools', this.schoolId(), 'classes'];
  }

  ngOnInit(): void {
    // schoolId từ param /:id của route cha
    const schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    this.schoolId.set(schoolId);

    // Default academicYear
    const year = new Date().getFullYear();
    this.classForm.patchValue({ academicYear: `${year}-${year + 1}` });

    // Teacher search debounce
    this.teacherSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchTeachers(term));

    // Load teachers ngay khi mở (schoolId đã biết)
    if (schoolId) {
      this.loadTeachers(schoolId);
    }

    // Load class data nếu edit mode (classId từ param :classId)
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const classId = params.get('classId');
          this.classId.set(classId);
          this.isEditMode.set(!!classId);
          if (classId) {
            return this.classesService.getById(classId);
          }
          return of(null);
        }),
        tap((res) => {
          if (res?.data) {
            this.classForm.patchValue({
              name: res.data.name,
              grade: res.data.grade,
              academicYear: res.data.academicYear,
              homeroomTeacherId: res.data.homeroomTeacher?.id ?? '',
            });
            if (res.data.homeroomTeacher) {
              this.teacherSearch.set(res.data.homeroomTeacher.fullName);
            }
          }
        }),
      )
      .subscribe();
  }

  // ─── Teacher Autocomplete ─────────────────────────────────────────────────

  loadTeachers(schoolId: string): void {
    this.loadingTeachers.set(true);
    this.usersService
      .getAll({ role: 'HOMEROOM_TEACHER', schoolId, perPage: 50 })
      .subscribe({
        next: (res) => {
          this.teachers.set(res.data);
          this.loadingTeachers.set(false);
        },
        error: () => this.loadingTeachers.set(false),
      });
  }

  searchTeachers(term: string): void {
    this.loadingTeachers.set(true);
    this.usersService
      .getAll({
        role: 'HOMEROOM_TEACHER',
        schoolId: this.schoolId(),
        search: term || undefined,
        perPage: 50,
      })
      .subscribe({
        next: (res) => {
          this.teachers.set(res.data);
          this.loadingTeachers.set(false);
        },
        error: () => this.loadingTeachers.set(false),
      });
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearch.set(value);
    this.teacherSearchSubject.next(value);
    if (!value) {
      this.classForm.patchValue({ homeroomTeacherId: '' });
    }
  }

  selectTeacher(teacher: User): void {
    this.teacherSearch.set(teacher.fullName);
    this.classForm.patchValue({ homeroomTeacherId: teacher.id });
  }

  displayTeacher = (id: string): string => {
    const found = this.teachers().find((t) => t.id === id);
    return found ? found.fullName : '';
  };

  // ─── Form Submit ──────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.classForm.invalid) return;

    const val = this.classForm.value;
    this.saving.set(true);

    const id = this.classId();
    const request$ =
      id && this.isEditMode()
        ? this.classesService.update(id, {
            name: val.name!,
            homeroomTeacherId: val.homeroomTeacherId || null,
          })
        : this.classesService.create({
            name: val.name!,
            grade: val.grade!,
            academicYear: val.academicYear!,
            schoolId: this.schoolId(),
            homeroomTeacherId: val.homeroomTeacherId || undefined,
          });

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode() ? 'Đã cập nhật lớp học' : 'Đã tạo lớp học mới',
        );
        this.saving.set(false);
        void this.router.navigate(this.backUrl);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Lưu lớp học thất bại'));
        this.saving.set(false);
      },
    });
  }

  async onDelete(): Promise<void> {
    const id = this.classId();
    if (!id) return;

    const confirmed = await this.confirmService.confirm({
      title: 'Xóa lớp học',
      message: 'Xóa lớp học này? Thao tác không thể hoàn tác.',
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (!confirmed) return;

    this.classesService.delete(id).subscribe({
      next: () => {
        this.toastService.success('Đã xóa lớp học');
        void this.router.navigate(this.backUrl);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xóa thất bại'));
      },
    });
  }
}
