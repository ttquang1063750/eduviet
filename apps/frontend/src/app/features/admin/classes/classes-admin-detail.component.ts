import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassesService, ClassDetail } from '../../../core/services/classes.service';
import { SchoolsService } from '../../../core/services/schools.service';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { School, User } from '@eduviet/shared-types';
import { switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { getApiErrorMessage } from '../../../core/utils/http-error';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-classes-admin-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './classes-admin-detail.component.html',
  styleUrl: './classes-admin-detail.component.scss',
})
export class ClassesAdminDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classesService = inject(ClassesService);
  private schoolsService = inject(SchoolsService);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  classForm = this.fb.group({
    name: ['', Validators.required],
    grade: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
    academicYear: ['', Validators.required],
    schoolId: ['', Validators.required],
    homeroomTeacherId: [''],
  });

  classId = signal<string | null>(null);
  isEditMode = signal(false);
  saving = signal(false);
  // schoolId cha (khi điều hướng từ trang trường)
  fromSchoolId = signal<string | null>(null);

  // School picker
  schoolSearch = signal('');
  schools = signal<School[]>([]);
  selectedSchool = signal<School | null>(null);
  showSchoolDropdown = signal(false);
  loadingSchools = signal(false);

  // Teacher picker
  teachers = signal<User[]>([]);
  selectedTeacher = signal<User | null>(null);
  teacherSearch = signal('');
  showTeacherDropdown = signal(false);
  loadingTeachers = signal(false);

  // ── Student management ──────────────────────────────────────
  enrollments = signal<ClassDetail['enrollments']>([]);
  enrolledIds = computed(() => new Set(this.enrollments().map((e) => e.user.id)));

  // Add-student panel
  showAddStudent = signal(false);
  studentSearchTerm = signal('');
  studentResults = signal<User[]>([]);
  searchingStudents = signal(false);
  loadingMoreStudents = signal(false);
  studentHasMore = signal(false);
  private studentPage = 1;
  private readonly STUDENT_PER_PAGE = 10;
  enrollingId = signal<string | null>(null);

  private studentSearchSubject = new Subject<string>();
  private schoolSearchSubject = new Subject<string>();
  private teacherSearchSubject = new Subject<string>();

  ngOnInit(): void {
    const year = new Date().getFullYear();
    this.classForm.patchValue({ academicYear: `${year}-${year + 1}` });

    this.schoolSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchSchools(term));

    this.teacherSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchTeachers(term));

    this.studentSearchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => this.searchStudents(term));

    // Đọc queryParam ?schoolId khi tạo lớp mới từ trang trường
    this.route.queryParamMap.subscribe((qp) => {
      const schoolId = qp.get('schoolId');
      if (schoolId) {
        this.fromSchoolId.set(schoolId);
        // Chỉ pre-fill khi chưa ở editMode
        if (!this.isEditMode()) {
          this.schoolsService.findById(schoolId).subscribe((school) => {
            this.selectedSchool.set(school);
            this.schoolSearch.set(school.name);
            this.classForm.patchValue({ schoolId: school.id });
            this.loadTeachersBySchool(school.id);
          });
        }
      }
    });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.classId.set(id);
          this.isEditMode.set(!!id && id !== 'new');
          if (id && id !== 'new') {
            return this.classesService.getById(id);
          }
          return of(null);
        }),
        tap((res) => {
          if (res?.data) {
            this.classForm.patchValue({
              name: res.data.name,
              grade: res.data.grade,
              academicYear: res.data.academicYear,
              schoolId: res.data.school.id,
              homeroomTeacherId: res.data.homeroomTeacher?.id ?? '',
            });
            this.selectedSchool.set(res.data.school as School);
            this.enrollments.set(res.data.enrollments ?? []);
            if (res.data.homeroomTeacher) {
              this.selectedTeacher.set(res.data.homeroomTeacher as User);
              this.loadTeachersBySchool(res.data.school.id);
            }
          }
        }),
      )
      .subscribe();
  }

  // ── Student search & enroll ──────────────────────────────────

  onStudentSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.studentSearchTerm.set(value);
    this.studentSearchSubject.next(value);
  }

  /** Reset về trang 1 và load mới (gọi khi mở panel hoặc đổi search term) */
  searchStudents(term: string): void {
    this.studentPage = 1;
    this.studentResults.set([]);
    this.studentHasMore.set(false);
    this.fetchStudents(term, false);
  }

  /** Gọi API, append hoặc replace kết quả */
  private fetchStudents(term: string, append: boolean): void {
    if (append) {
      this.loadingMoreStudents.set(true);
    } else {
      this.searchingStudents.set(true);
    }

    this.usersService
      .getAll({
        role: 'STUDENT',
        search: term || undefined,
        page: this.studentPage,
        perPage: this.STUDENT_PER_PAGE,
      })
      .subscribe({
        next: (res) => {
          const filtered = res.data.filter((u) => !this.enrolledIds().has(u.id));
          if (append) {
            this.studentResults.update((prev) => [...prev, ...filtered]);
          } else {
            this.studentResults.set(filtered);
          }
          // Còn trang tiếp theo không
          const meta = (res as { meta?: { totalPages?: number } }).meta;
          this.studentHasMore.set(
            meta?.totalPages ? this.studentPage < meta.totalPages : res.data.length === this.STUDENT_PER_PAGE,
          );
          this.searchingStudents.set(false);
          this.loadingMoreStudents.set(false);
        },
        error: () => {
          this.searchingStudents.set(false);
          this.loadingMoreStudents.set(false);
        },
      });
  }

  /** Gọi khi scroll gần đáy danh sách */
  onStudentListScroll(event: Event): void {
    if (this.loadingMoreStudents() || !this.studentHasMore()) return;
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    if (nearBottom) {
      this.studentPage += 1;
      this.fetchStudents(this.studentSearchTerm(), true);
    }
  }

  enroll(student: User): void {
    const classId = this.classId();
    if (!classId) return;
    this.enrollingId.set(student.id);
    this.classesService.enroll(classId, student.id).subscribe({
      next: () => {
        // Thêm vào danh sách local ngay lập tức
        this.enrollments.update((prev) => [
          ...prev,
          { id: '', user: { id: student.id, fullName: student.fullName, email: student.email, avatarUrl: student.avatarUrl ?? null, roles: student.roles as string[] }, createdAt: new Date().toISOString() },
        ]);
        this.studentResults.update((prev) => prev.filter((u) => u.id !== student.id));
        this.enrollingId.set(null);
        this.toastService.success(`Đã thêm ${student.fullName} vào lớp`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Thêm học sinh thất bại'));
        this.enrollingId.set(null);
      },
    });
  }

  async unenroll(enrollment: ClassDetail['enrollments'][number]): Promise<void> {
    const classId = this.classId();
    if (!classId) return;
    const confirmed = await this.confirmService.confirm({
      title: 'Xóa học sinh khỏi lớp',
      message: `Xóa ${enrollment.user.fullName} khỏi lớp này?`,
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (!confirmed) return;
    this.classesService.unenroll(classId, enrollment.user.id).subscribe({
      next: () => {
        this.enrollments.update((prev) => prev.filter((e) => e.user.id !== enrollment.user.id));
        this.toastService.success(`Đã xóa ${enrollment.user.fullName} khỏi lớp`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xóa học sinh thất bại'));
      },
    });
  }

  toggleAddStudent(): void {
    this.showAddStudent.update((v) => !v);
    if (this.showAddStudent()) {
      // Mở panel → load 10 học sinh đầu tiên ngay
      this.searchStudents(this.studentSearchTerm());
    } else {
      this.studentSearchTerm.set('');
      this.studentResults.set([]);
      this.studentHasMore.set(false);
    }
  }

  backUrl(): string[] {
    const fromSchool = this.fromSchoolId();
    return fromSchool ? ['/admin/schools', fromSchool] : ['/admin/classes'];
  }

  // ─── School Picker ────────────────────────────────────────────────────────

  onSchoolSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.schoolSearch.set(value);
    this.showSchoolDropdown.set(true);
    this.schoolSearchSubject.next(value);
  }

  searchSchools(term: string): void {
    this.loadingSchools.set(true);
    this.schoolsService
      .find({ page: 1, perPage: 20, search: term || undefined })
      .subscribe({
        next: (res) => {
          this.schools.set(res.data);
          this.loadingSchools.set(false);
        },
        error: () => this.loadingSchools.set(false),
      });
  }

  openSchoolDropdown(): void {
    if (this.schools().length === 0) {
      this.searchSchools('');
    }
    this.showSchoolDropdown.set(true);
  }

  selectSchool(school: School): void {
    this.selectedSchool.set(school);
    this.classForm.patchValue({ schoolId: school.id, homeroomTeacherId: '' });
    this.selectedTeacher.set(null);
    this.showSchoolDropdown.set(false);
    this.schoolSearch.set(school.name);
    // Load teachers for this school
    this.loadTeachersBySchool(school.id);
  }

  clearSchool(): void {
    this.selectedSchool.set(null);
    this.classForm.patchValue({ schoolId: '', homeroomTeacherId: '' });
    this.selectedTeacher.set(null);
    this.schoolSearch.set('');
    this.teachers.set([]);
  }

  // ─── Teacher Picker ───────────────────────────────────────────────────────

  loadTeachersBySchool(schoolId: string): void {
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

  onTeacherSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearch.set(value);
    this.showTeacherDropdown.set(true);
    this.teacherSearchSubject.next(value);
  }

  searchTeachers(term: string): void {
    const schoolId = this.classForm.value.schoolId;
    if (!schoolId) return;
    this.loadingTeachers.set(true);
    this.usersService
      .getAll({ role: 'HOMEROOM_TEACHER', schoolId, search: term || undefined, perPage: 50 })
      .subscribe({
        next: (res) => {
          this.teachers.set(res.data);
          this.loadingTeachers.set(false);
        },
        error: () => this.loadingTeachers.set(false),
      });
  }

  openTeacherDropdown(): void {
    const schoolId = this.classForm.value.schoolId;
    if (!schoolId) return;
    this.showTeacherDropdown.set(true);
  }

  selectTeacher(teacher: User): void {
    this.selectedTeacher.set(teacher);
    this.classForm.patchValue({ homeroomTeacherId: teacher.id });
    this.showTeacherDropdown.set(false);
    this.teacherSearch.set(teacher.fullName);
  }

  clearTeacher(): void {
    this.selectedTeacher.set(null);
    this.classForm.patchValue({ homeroomTeacherId: '' });
    this.teacherSearch.set('');
  }

  // ─── Form Submit ──────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.classForm.invalid) return;

    const val = this.classForm.value;
    this.saving.set(true);

    const payload = {
      name: val.name!,
      grade: val.grade!,
      academicYear: val.academicYear!,
      schoolId: val.schoolId!,
      homeroomTeacherId: val.homeroomTeacherId || undefined,
    };

    const id = this.classId();
    const request$ =
      id && this.isEditMode()
        ? this.classesService.update(id, {
            name: payload.name,
            homeroomTeacherId: payload.homeroomTeacherId ?? null,
          })
        : this.classesService.create(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode() ? 'Đã cập nhật lớp học' : 'Đã tạo lớp học mới',
        );
        this.saving.set(false);
        void this.router.navigate(this.backUrl());
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Lưu lớp học thất bại'));
        this.saving.set(false);
      },
    });
  }
}
