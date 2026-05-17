import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SchoolsService } from '../../../core/services/schools.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { School } from '@eduviet/shared-types';
import { of, switchMap, tap } from 'rxjs';
import { getApiErrorMessage } from '../../../core/utils/http-error';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-schools-admin-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schools-admin-detail.component.html',
  styleUrl: './schools-admin-detail.component.scss',
})
export class SchoolsAdminDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolsService = inject(SchoolsService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);

  schoolForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    districtId: [''],
  });

  schoolId = signal<string | null>(null);
  isEditMode = signal(false);
  saving = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.schoolId.set(id);
        this.isEditMode.set(!!id);
        if (id) {
          return this.schoolsService.findById(id);
        }
        return of(null);
      }),
      tap(school => {
        if (school) {
          this.schoolForm.patchValue(school);
        }
      }),
    ).subscribe();
  }

  onSubmit(): void {
    if (this.schoolForm.invalid) return;

    const raw = this.schoolForm.value;
    const formData: Partial<School> = {
      name: raw.name ?? undefined,
      code: raw.code ?? undefined,
      address: raw.address ?? undefined,
      phone: raw.phone ?? undefined,
      email: raw.email ?? undefined,
      districtId: raw.districtId ?? undefined,
    };

    const operation = this.isEditMode()
      ? this.schoolsService.update(this.schoolId()!, formData)
      : this.schoolsService.create(formData);

    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.toastService.success(this.isEditMode() ? $localize`Đã cập nhật trường học` : $localize`Đã tạo trường học`);
        void this.router.navigate(['/admin/schools']);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Lưu thất bại`));
        this.saving.set(false);
      },
    });
  }

  async onDelete(): Promise<void> {
    if (!this.isEditMode()) return;

    const confirmed = await this.confirmService.confirm({
      title: $localize`Xác nhận xóa`,
      message: $localize`Bạn có chắc chắn muốn xóa trường này?`,
      type: 'danger',
    });

    if (confirmed) {
      this.schoolsService.delete(this.schoolId()!).subscribe({
        next: () => {
          this.toastService.success($localize`Đã xóa trường học`);
          void this.router.navigate(['/admin/schools']);
        },
        error: (err: unknown) => {
          this.toastService.error(getApiErrorMessage(err, $localize`Xóa thất bại`));
        },
      });
    }
  }
}
