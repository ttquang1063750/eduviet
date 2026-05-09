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
import { SchoolsService } from '../../../core/services/schools.service';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { School, User } from '@eduviet/shared-types';
import { switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { getApiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-classes-admin-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
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

  private schoolSearchSubject = new Subject<string>();
  private teacherSearchSubject = new Subject<string>();

  ngOnInit(): void {
    // Populate current academic year default
    const year = new Date().getFullYear();
    this.classForm.patchValue({ academicYear: `${year}-${year + 1}` });

    // School search with debounce
    this.schoolSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchSchools(term));

    // Teacher search with debounce
    this.teacherSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchTeachers(term));

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
            if (res.data.homeroomTeacher) {
              this.selectedTeacher.set(res.data.homeroomTeacher as User);
              // Load teachers for this school
              this.loadTeachersBySchool(res.data.school.id);
            }
          }
        }),
      )
      .subscribe();
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
        this.router.navigate(['/admin/classes']);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Lưu lớp học thất bại'));
        this.saving.set(false);
      },
    });
  }
}
