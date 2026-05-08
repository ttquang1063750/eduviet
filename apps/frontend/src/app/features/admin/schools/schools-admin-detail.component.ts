import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SchoolsService } from '../../../core/services/schools.service';
import { School } from '@eduviet/shared-types';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-schools-admin-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <h2>{{ isEditMode ? 'Chỉnh sửa trường học' : 'Tạo trường học mới' }}</h2>

      <form [formGroup]="schoolForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Tên trường</label>
          <input id="name" type="text" formControlName="name" class="form-control">
        </div>
        <div class="form-group">
          <label for="code">Mã trường</label>
          <input id="code" type="text" formControlName="code" class="form-control">
        </div>
        <div class="form-group">
          <label for="address">Địa chỉ</label>
          <input id="address" type="text" formControlName="address" class="form-control">
        </div>
        <div class="form-group">
          <label for="phone">Số điện thoại</label>
          <input id="phone" type="text" formControlName="phone" class="form-control">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" class="form-control">
        </div>

        <div class="form-actions">
          <button type="submit" [disabled]="schoolForm.invalid" class="btn btn-primary">
            {{ isEditMode ? 'Lưu thay đổi' : 'Tạo mới' }}
          </button>
          <a routerLink="/admin/schools" class="btn btn-secondary">Hủy</a>
          <button *ngIf="isEditMode" type="button" (click)="onDelete()" class="btn btn-danger">
            Xóa
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .admin-container { padding: 20px; max-width: 800px; margin: auto; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
    .form-control { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .form-actions { margin-top: 20px; display: flex; gap: 10px; }
    .btn { padding: 10px 20px; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; border: none; }
    .btn-primary { background-color: #3b82f6; color: white; }
    .btn-secondary { background-color: #6b7280; color: white; }
    .btn-danger { background-color: #ef4444; color: white; }
    .btn:disabled { background-color: #9ca3af; cursor: not-allowed; }
  `]
})
export class SchoolsAdminDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolsService = inject(SchoolsService);

  schoolForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
    districtId: [''] // This should be a dropdown in a real app
  });

  schoolId: string | null = null;
  isEditMode = false;

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.schoolId = params.get('id');
        this.isEditMode = !!this.schoolId;
        if (this.isEditMode) {
          return this.schoolsService.findById(this.schoolId!);
        }
        return of(null);
      }),
      tap(school => {
        if (school) {
          this.schoolForm.patchValue(school);
        }
      })
    ).subscribe();
  }

  onSubmit() {
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
    const operation = this.isEditMode
      ? this.schoolsService.update(this.schoolId!, formData)
      : this.schoolsService.create(formData);

    operation.subscribe(() => {
      this.router.navigate(['/admin/schools']);
    });
  }

  onDelete() {
    if (this.isEditMode && confirm('Bạn có chắc chắn muốn xóa trường này?')) {
      this.schoolsService.delete(this.schoolId!).subscribe(() => {
        this.router.navigate(['/admin/schools']);
      });
    }
  }
}
