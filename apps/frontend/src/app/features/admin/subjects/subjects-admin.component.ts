import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubjectsService } from '../../../core/services/subjects.service';
import { Subject, SubjectCode } from '@eduviet/shared-types';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';

const SUBJECT_CODE_LABELS: Record<SubjectCode, string> = {
  MATH: $localize`Toán học`,
  PHYSICS: $localize`Vật lý`,
  CHEMISTRY: $localize`Hóa học`,
  BIOLOGY: $localize`Sinh học`,
  LITERATURE: $localize`Ngữ văn`,
  ENGLISH: $localize`Tiếng Anh`,
  HISTORY: $localize`Lịch sử`,
  GEOGRAPHY: $localize`Địa lý`,
  CIVIC_EDUCATION: $localize`Giáo dục công dân`,
  INFORMATICS: $localize`Tin học`,
};

const ALL_CODES = Object.keys(SUBJECT_CODE_LABELS) as SubjectCode[];

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-subjects-admin',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatCardModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subjects-admin.component.html',
  styleUrl: './subjects-admin.component.scss',
})
export class SubjectsAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private subjectsService = inject(SubjectsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  subjects = signal<Subject[]>([]);
  loading = signal(false);

  // Available codes = all codes NOT yet in subjects list
  availableCodes = signal<SubjectCode[]>([]);

  // Modal state
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  suggesting = signal(false);

  codeLabels = SUBJECT_CODE_LABELS;

  subjectForm = this.fb.group({
    code: ['' as SubjectCode | '', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    nameEn: ['', [Validators.required, Validators.maxLength(100)]],
    color: ['#4A90E2'],
    iconUrl: [''],
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading.set(true);
    this.subjectsService.list().subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        const usedCodes = new Set(subjects.map((s) => s.code));
        this.availableCodes.set(ALL_CODES.filter((c) => !usedCodes.has(c)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.subjectForm.reset({ code: '', name: '', nameEn: '', color: '#4A90E2', iconUrl: '' });
    this.subjectForm.get('code')?.enable();
    this.showModal.set(true);
  }

  openEdit(subject: Subject): void {
    this.editingId.set(subject.id);
    this.subjectForm.patchValue({
      code: subject.code,
      name: subject.name,
      nameEn: subject.nameEn,
      color: subject.color ?? '#4A90E2',
      iconUrl: subject.iconUrl ?? '',
    });
    // Code cannot be changed after creation
    this.subjectForm.get('code')?.disable();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onAutoSuggest(): void {
    const code = this.subjectForm.get('code')?.value as SubjectCode | '';
    if (!code) {
      this.toastService.error($localize`Chọn mã môn học trước khi dùng AI gợi ý.`);
      return;
    }
    this.suggesting.set(true);
    this.subjectsService.suggest(code).subscribe({
      next: (suggestion) => {
        this.subjectForm.patchValue({
          name: suggestion.name,
          nameEn: suggestion.nameEn,
          color: suggestion.color,
          iconUrl: suggestion.iconUrl,
        });
        this.suggesting.set(false);
        this.toastService.success($localize`AI đã gợi ý thông tin môn học!`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`AI gợi ý thất bại`));
        this.suggesting.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) return;
    this.saving.set(true);

    const val = this.subjectForm.getRawValue();

    if (this.editingId()) {
      this.subjectsService
        .update(this.editingId()!, {
          name: val.name!,
          nameEn: val.nameEn!,
          color: val.color || undefined,
          iconUrl: val.iconUrl || undefined,
        })
        .subscribe({
          next: (updated) => {
            this.subjects.update((list) =>
              list.map((s) => (s.id === updated.id ? updated : s)),
            );
            this.toastService.success($localize`Đã cập nhật môn học`);
            this.saving.set(false);
            this.closeModal();
          },
          error: (err: unknown) => {
            this.toastService.error(getApiErrorMessage(err, $localize`Cập nhật thất bại`));
            this.saving.set(false);
          },
        });
    } else {
      this.subjectsService
        .create({
          code: val.code as SubjectCode,
          name: val.name!,
          nameEn: val.nameEn!,
          color: val.color || undefined,
          iconUrl: val.iconUrl || undefined,
        })
        .subscribe({
          next: (created) => {
            this.subjects.update((list) => [...list, created]);
            const usedCodes = new Set(this.subjects().map((s) => s.code));
            this.availableCodes.set(ALL_CODES.filter((c) => !usedCodes.has(c)));
            this.toastService.success($localize`Đã tạo môn học mới`);
            this.saving.set(false);
            this.closeModal();
          },
          error: (err: unknown) => {
            this.toastService.error(getApiErrorMessage(err, $localize`Tạo môn học thất bại`));
            this.saving.set(false);
          },
        });
    }
  }

  async onDelete(subject: Subject): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: $localize`Xóa môn học`,
      message: $localize`Bạn có chắc muốn xóa môn học "${subject.name}"? Thao tác này không thể hoàn tác.`,
      confirmText: $localize`Xóa`,
      type: 'danger',
    });
    if (!confirmed) return;

    this.subjectsService.delete(subject.id).subscribe({
      next: () => {
        this.subjects.update((list) => list.filter((s) => s.id !== subject.id));
        const usedCodes = new Set(this.subjects().map((s) => s.code));
        this.availableCodes.set(ALL_CODES.filter((c) => !usedCodes.has(c)));
        this.toastService.success($localize`Đã xóa môn học`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Xóa thất bại`));
      },
    });
  }

  getCodeLabel(code: SubjectCode): string {
    return SUBJECT_CODE_LABELS[code] ?? code;
  }

  trackById(_index: number, subject: Subject): string {
    return subject.id;
  }
}
