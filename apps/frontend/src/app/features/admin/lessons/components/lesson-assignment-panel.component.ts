import { Component, inject, signal, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LessonAssignmentsService } from '../../../../core/services/lesson-assignments.service';
import { SchoolsService } from '../../../../core/services/schools.service';
import { ClassesService, ClassItem } from '../../../../core/services/classes.service';
import { UsersService } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error';
import {
  LessonAssignment,
  AssignmentScope,
  User,
  School,
} from '@eduviet/shared-types';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-lesson-assignment-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './lesson-assignment-panel.component.html',
  styleUrl: './lesson-assignment-panel.component.scss',
})
export class LessonAssignmentPanelComponent implements OnInit {
  private assignmentsService = inject(LessonAssignmentsService);
  private schoolsService = inject(SchoolsService);
  private classesService = inject(ClassesService);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private fb = inject(FormBuilder);

  lessonId = input.required<string>();

  assignments = signal<LessonAssignment[]>([]);
  loading = signal(false);
  submitting = signal(false);

  // Form targets
  schools = signal<School[]>([]);
  classes = signal<ClassItem[]>([]);
  students = signal<User[]>([]);

  assignmentForm = this.fb.group({
    scope: ['CLASS' as AssignmentScope, Validators.required],
    targetId: ['', Validators.required],
    note: [''],
    dueDate: [null as Date | null],
  });

  displayedColumns = ['target', 'assignedBy', 'dueDate', 'actions'];

  ngOnInit() {
    this.loadAssignments();
    this.loadTargets();

    // Reset targetId when scope changes
    this.assignmentForm.get('scope')?.valueChanges.subscribe(() => {
      this.assignmentForm.get('targetId')?.setValue('');
    });
  }

  loadAssignments() {
    this.loading.set(true);
    this.assignmentsService.listByLesson(this.lessonId()).subscribe({
      next: (res) => {
        this.assignments.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTargets() {
    // Load schools
    this.schoolsService.find({ perPage: 100 }).subscribe((res) => this.schools.set(res.data));
    
    // Load classes
    this.classesService.getAll({ perPage: 100 }).subscribe((res) => this.classes.set(res.data));
    
    // Load students
    this.usersService.getAll({ role: 'STUDENT', perPage: 100 }).subscribe((res) => this.students.set(res.data));
  }

  onAssign() {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const val = this.assignmentForm.getRawValue();
    
    this.assignmentsService.assign({
      lessonId: this.lessonId(),
      scope: val.scope!,
      targetId: val.targetId!,
      note: val.note || undefined,
      dueDate: val.dueDate?.toISOString(),
    }).subscribe({
      next: () => {
        this.toast.success($localize`Đã gán bài học thành công`);
        this.loadAssignments();
        this.assignmentForm.patchValue({ targetId: '', note: '', dueDate: null });
        this.submitting.set(false);
      },
      error: (err: unknown) => {
        this.toast.error(getApiErrorMessage(err, $localize`Gán bài học thất bại`));
        this.submitting.set(false);
      },
    });
  }

  async onUnassign(assignment: LessonAssignment) {
    const confirmed = await this.confirm.confirm({
      title: $localize`Xóa phân công`,
      message: $localize`Bạn có chắc chắn muốn xóa phân công này?`,
      confirmText: $localize`Xóa`,
      type: 'danger',
    });

    if (confirmed) {
      this.assignmentsService.unassign(assignment.id).subscribe({
        next: () => {
          this.toast.success($localize`Đã xóa phân công`);
          this.loadAssignments();
        },
        error: (err: unknown) => {
          this.toast.error(getApiErrorMessage(err, $localize`Xóa phân công thất bại`));
        },
      });
    }
  }

  getTargetName(assignment: any): string {
    if (assignment.school) return $localize`Trường: ${assignment.school.name}`;
    if (assignment.class) return $localize`Lớp: ${assignment.class.name}`;
    if (assignment.user) return $localize`HS: ${assignment.user.fullName}`;
    return '—';
  }
}
