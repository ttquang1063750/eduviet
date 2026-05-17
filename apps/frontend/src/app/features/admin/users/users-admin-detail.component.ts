import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { SchoolsService } from '../../../core/services/schools.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import type { User, School, UserRole } from '@eduviet/shared-types';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-users-admin-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-admin-detail.component.html',
  styleUrl: './users-admin-detail.component.scss',
})
export class UsersAdminDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private schoolsService = inject(SchoolsService);
  private authService = inject(AuthService);
  private breadcrumbService = inject(BreadcrumbService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly isSaving = signal(false);
  readonly schools = signal<School[]>([]);

  readonly form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^(\+84|0)[0-9]{9}$/)]],
    roles: [[] as UserRole[], [Validators.required]],
    title: [''],
    schoolId: [''],
    isActive: [true],
  });

  readonly isSuperAdmin = computed(() => this.authService.hasRole('SUPER_ADMIN'));
  readonly canAssignSchool = computed(() =>
    this.authService.hasRole('SUPER_ADMIN') ||
    (this.authService.hasRole('SCHOOL_ADMIN') && !this.user()?.roles?.includes('SUPER_ADMIN'))
  );
  readonly currentUserId = this.authService.user()?.id;

  readonly allRoles: { value: UserRole; label: string }[] = [
    { value: 'SUPER_ADMIN', label: $localize`Super Admin` },
    { value: 'PROVINCE_ADMIN', label: $localize`Admin Tỉnh` },
    { value: 'DISTRICT_ADMIN', label: $localize`Admin Huyện` },
    { value: 'SCHOOL_ADMIN', label: $localize`Admin Trường` },
    { value: 'CONTENT_CREATOR', label: $localize`Soạn thảo` },
    { value: 'CONTENT_REVIEWER', label: $localize`Reviewer` },
    { value: 'CONTENT_APPROVER', label: $localize`Phê duyệt` },
    { value: 'GRADER', label: $localize`Chấm điểm` },
    { value: 'SUBJECT_TEACHER', label: $localize`Giáo viên bộ môn` },
    { value: 'HOMEROOM_TEACHER', label: $localize`GV Chủ nhiệm` },
    { value: 'STUDENT', label: $localize`Học sinh` },
    { value: 'PARENT', label: $localize`Phụ huynh` },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/users']);
      return;
    }

    this.loadUser(id);
    this.loadSchools();
  }

  async loadUser(id: string) {
    this.loading.set(true);
    try {
      const res = await this.usersService.getById(id).toPromise();
      if (res) {
        this.user.set(res.data);
        this.breadcrumbService.setLabel('admin/users/:id', res.data.fullName);
        this.form.patchValue({
          email: res.data.email,
          fullName: res.data.fullName,
          phone: res.data.phone ?? '',
          roles: res.data.roles,
          title: res.data.title ?? '',
          schoolId: res.data.schoolId ?? '',
          isActive: res.data.isActive,
        });
      }
    } catch (error) {
      console.error('Failed to load user', error);
      this.toastService.error($localize`Không thể tải thông tin người dùng`);
      this.router.navigate(['/admin/users']);
    } finally {
      this.loading.set(false);
    }
  }

  async loadSchools() {
    if (this.isSuperAdmin()) {
      try {
        const res = await this.schoolsService.find({ perPage: 100 }).toPromise();
        if (res) this.schools.set(res.data);
      } catch (error) {
        console.error('Failed to load schools', error);
      }
    }
  }

  async onUpdateInfo() {
    if (!this.user()) return;
    const { fullName, phone, isActive, title } = this.form.getRawValue();

    this.isSaving.set(true);
    try {
      await this.usersService
        .update(this.user()!.id, { fullName, phone, isActive, title: title || undefined })
        .toPromise();
      this.toastService.success($localize`Cập nhật thông tin thành công`);
    } catch (error: unknown) {
      this.toastService.error(getApiErrorMessage(error, $localize`Lỗi cập nhật`));
    } finally {
      this.isSaving.set(false);
    }
  }

  async onChangeRoles() {
    if (!this.user() || !this.isSuperAdmin()) return;
    const { roles } = this.form.getRawValue();

    if (this.user()!.id === this.currentUserId) {
      this.toastService.warning($localize`Bạn không thể tự thay đổi vai trò của chính mình`);
      return;
    }

    if (roles.length === 0) {
      this.toastService.warning($localize`Phải chọn ít nhất 1 vai trò`);
      return;
    }

    this.isSaving.set(true);
    try {
      await this.usersService.changeRoles(this.user()!.id, roles).toPromise();
      this.toastService.success($localize`Thay đổi vai trò thành công`);
    } catch (error: unknown) {
      this.toastService.error(getApiErrorMessage(error, $localize`Lỗi đổi vai trò`));
    } finally {
      this.isSaving.set(false);
    }
  }

  async onAssignSchool() {
    if (!this.user()) return;
    const { schoolId } = this.form.getRawValue();

    this.isSaving.set(true);
    try {
      await this.usersService.assignSchool(this.user()!.id, schoolId || null).toPromise();
      this.toastService.success($localize`Gán trường học thành công`);
    } catch (error: unknown) {
      this.toastService.error(getApiErrorMessage(error, $localize`Lỗi gán trường`));
    } finally {
      this.isSaving.set(false);
    }
  }

  async onDelete() {
    if (!this.user()) return;
    if (this.user()!.id === this.currentUserId) {
      this.toastService.warning($localize`Bạn không thể xóa tài khoản của chính mình`);
      return;
    }

    const confirmed = await this.confirmService.confirm({
      title: $localize`Xác nhận xóa`,
      message: $localize`Bạn có chắc muốn xóa người dùng ${this.user()!.fullName}? Hành động này không thể hoàn tác.`,
      confirmText: $localize`Xóa người dùng`,
      type: 'danger',
    });

    if (confirmed) {
      try {
        await this.usersService.delete(this.user()!.id).toPromise();
        this.toastService.success($localize`Xóa người dùng thành công`);
        this.router.navigate(['/admin/users']);
      } catch (error: unknown) {
        this.toastService.error(getApiErrorMessage(error, $localize`Lỗi xóa người dùng`));
      }
    }
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      SUPER_ADMIN: $localize`Super Admin`,
      PROVINCE_ADMIN: $localize`Admin Tỉnh`,
      DISTRICT_ADMIN: $localize`Admin Huyện`,
      SCHOOL_ADMIN: $localize`Admin Trường`,
      CONTENT_CREATOR: $localize`Soạn thảo`,
      CONTENT_REVIEWER: $localize`Reviewer`,
      CONTENT_APPROVER: $localize`Phê duyệt`,
      GRADER: $localize`Chấm điểm`,
      SUBJECT_TEACHER: $localize`Giáo viên bộ môn`,
      HOMEROOM_TEACHER: $localize`GV Chủ nhiệm`,
      STUDENT: $localize`Học sinh`,
      PARENT: $localize`Phụ huynh`,
    };
    return labels[role] ?? role;
  }
}
