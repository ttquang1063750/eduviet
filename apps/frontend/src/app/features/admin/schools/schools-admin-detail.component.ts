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
import { ClassesService, ClassItem } from '../../../core/services/classes.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { School } from '@eduviet/shared-types';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { getApiErrorMessage } from '../../../core/utils/http-error';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

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
    MatChipsModule,
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
  private classesService = inject(ClassesService);
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

  // Classes in this school
  schoolClasses = signal<ClassItem[]>([]);
  loadingClasses = signal(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.schoolId.set(id);
        this.isEditMode.set(!!id);
        if (id) {
          this.loadClasses(id);
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

  loadClasses(schoolId: string): void {
    this.loadingClasses.set(true);
    this.classesService.getAll({ schoolId, perPage: 100 }).subscribe({
      next: (res) => {
        this.schoolClasses.set(res.data);
        this.loadingClasses.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Không thể tải danh sách lớp'));
        this.loadingClasses.set(false);
      },
    });
  }

  goToCreateClass(): void {
    void this.router.navigate(['/admin/classes', 'new'], {
      queryParams: { schoolId: this.schoolId() },
    });
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

    operation.subscribe(() => {
      this.router.navigate(['/admin/schools']);
    });
  }

  async onDelete(): Promise<void> {
    if (!this.isEditMode()) return;

    const confirmed = await this.confirmService.confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa trường này?',
      type: 'danger',
    });

    if (confirmed) {
      this.schoolsService.delete(this.schoolId()!).subscribe(() => {
        this.router.navigate(['/admin/schools']);
      });
    }
  }
}
