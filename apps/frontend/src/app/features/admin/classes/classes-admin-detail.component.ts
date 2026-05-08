import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassesService } from '../../../core/services/classes.service';
import { Class } from '@eduviet/shared-types';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-classes-admin-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <h2>{{ isEditMode ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới' }}</h2>

      <form [formGroup]="classForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Tên lớp</label>
          <input id="name" type="text" formControlName="name" class="form-control">
        </div>
        <div class="form-group">
          <label for="schoolId">Trường</label>
          <input id="schoolId" type="text" formControlName="schoolId" class="form-control">
        </div>
        <div class="form-group">
          <label for="homeroomTeacherId">Giáo viên chủ nhiệm</label>
          <input id="homeroomTeacherId" type="text" formControlName="homeroomTeacherId" class="form-control">
        </div>

        <div class="form-actions">
          <button type="submit" [disabled]="classForm.invalid" class="btn btn-primary">
            {{ isEditMode ? 'Lưu thay đổi' : 'Tạo mới' }}
          </button>
          <a routerLink="/admin/classes" class="btn btn-secondary">Hủy</a>
          <!-- Soft delete can be added here later if needed -->
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
    .btn:disabled { background-color: #9ca3af; cursor: not-allowed; }
  `]
})
export class ClassesAdminDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classesService = inject(ClassesService);

  classForm = this.fb.group({
    name: ['', Validators.required],
    schoolId: ['', Validators.required],
    homeroomTeacherId: ['']
  });

  classId: string | null = null;
  isEditMode = false;

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.classId = params.get('id');
        this.isEditMode = !!this.classId;
        if (this.isEditMode) {
          return this.classesService.getById(this.classId!);
        }
        return of(null);
      }),
      tap(res => {
        if (res && res.data) {
          this.classForm.patchValue({
            name: res.data.name,
            schoolId: res.data.school.id,
            homeroomTeacherId: res.data.homeroomTeacher?.id || ''
          });
        }
      })
    ).subscribe();
  }

  onSubmit() {
    if (this.classForm.invalid) return;

    // For create and update, need an API or handle it appropriately
    // Currently classes.service.ts doesn't have create/update for admin,
    // we'll simulate the routing back for now or implement if backend supports.
    // If backend doesn't support yet, we might need to add it to backend task.
    alert('Thao tác lưu được giả lập (cần API backend)');
    this.router.navigate(['/admin/classes']);
  }
}
