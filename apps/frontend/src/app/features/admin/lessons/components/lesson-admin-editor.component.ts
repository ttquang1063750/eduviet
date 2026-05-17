import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { QuillModule } from 'ngx-quill';
import { LessonsService } from '../../../../core/services/lessons.service';
import { SubjectsService } from '../../../../core/services/subjects.service';
import { UsersService } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error';
import type { User, CreateLessonRequest } from '@eduviet/shared-types';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LessonAssignmentPanelComponent } from './lesson-assignment-panel.component';

@Component({
  selector: 'app-lesson-admin-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    QuillModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LessonAssignmentPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-admin-editor.component.html',
  styleUrl: './lesson-admin-editor.component.scss',
})
export class LessonAdminEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lessonsService = inject(LessonsService);
  private subjectsService = inject(SubjectsService);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);

  readonly lessonId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly subjects = signal<{ id: string; name: string }[]>([]);
  readonly reviewers = signal<User[]>([]);

  readonly lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    subjectId: ['', Validators.required],
    grade: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
    topic: ['', [Validators.required, Validators.minLength(2)]],
    difficulty: ['MEDIUM', Validators.required],
    theory: ['', [Validators.required, Validators.minLength(10)]],
    estimatedMinutes: [30, [Validators.required, Validators.min(1)]],
    timeLimitSec: [0, [Validators.min(0)]],
    maxAttempts: [0, [Validators.min(0)]],
    reviewerId: [null as string | null],

  });

  readonly quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image', 'video'],
    ],
  };

  ngOnInit() {
    this.loadSubjects();
    this.loadReviewers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.lessonId.set(id);
      this.loadLesson(id);
    }
  }

  private loadSubjects() {
    this.subjectsService.list().subscribe((list) => this.subjects.set(list));
  }

  private loadReviewers() {
    // Get users with CONTENT_REVIEWER or SUPER_ADMIN role
    this.usersService.getAll({ role: 'CONTENT_REVIEWER', perPage: 100 }).subscribe((res) => {
      this.reviewers.set(res.data);
    });
  }

  private loadLesson(id: string) {
    this.loading.set(true);
    this.lessonsService.getById(id).subscribe({
      next: (res) => {
        const lesson = res.data;
        this.lessonForm.patchValue({
          title: lesson.title,
          subjectId: lesson.subject.id,
          grade: lesson.grade,
          topic: lesson.topic,
          difficulty: lesson.difficulty,
          theory: lesson.theory,
          estimatedMinutes: lesson.estimatedMinutes,
          reviewerId: lesson.reviewerId ?? null,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Không thể tải bài học`));
        this.loading.set(false);
        this.router.navigate(['/admin/lessons']);
      },
    });
  }

  onSubmit() {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.lessonForm.value;
    const { reviewerId, ...lessonData } = formValue;

    if (this.lessonId()) {
      // Update
      this.lessonsService.update(this.lessonId()!, lessonData).subscribe({
        next: () => {
          // If reviewer changed, assign it
          if (reviewerId) {
            this.lessonsService.assignReviewer(this.lessonId()!, reviewerId).subscribe();
          }
          this.toastService.success($localize`Đã cập nhật bài học`);
          this.saving.set(false);
          this.router.navigate(['/admin/lessons']);
        },
        error: (err) => {
          this.toastService.error(getApiErrorMessage(err, $localize`Cập nhật thất bại`));
          this.saving.set(false);
        },
      });
    } else {
      // Create
      this.lessonsService.create(lessonData as CreateLessonRequest).subscribe({
        next: (res) => {
          const newId = res.data.id;
          if (reviewerId) {
            this.lessonsService.assignReviewer(newId, reviewerId).subscribe();
          }
          this.toastService.success($localize`Đã tạo bài học mới`);
          this.saving.set(false);
          this.router.navigate(['/admin/lessons']);
        },
        error: (err) => {
          this.toastService.error(getApiErrorMessage(err, $localize`Tạo bài học thất bại`));
          this.saving.set(false);
        },
      });
    }
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
