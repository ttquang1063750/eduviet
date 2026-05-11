import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { SchoolsService } from '../../../core/services/schools.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import type { User, CreateUserRequest, School } from '@eduviet/shared-types';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.scss',
})
export class UsersAdminComponent {
  private usersService = inject(UsersService);
  private schoolsService = inject(SchoolsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // States
  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly isSaving = signal(false);

  // Filters
  readonly search = signal('');
  readonly roleFilter = signal<string>('');
  readonly page = signal(1);
  readonly perPage = signal(20);

  // Modal State
  readonly showCreateModal = signal(false);
  readonly schools = signal<School[]>([]);
  readonly newUser = signal<CreateUserRequest>({
    email: '',
    fullName: '',
    password: '',
    roles: ['STUDENT'],
  });

  // Derived states
  readonly totalPages = computed(() => Math.ceil(this.total() / this.perPage()));
  readonly isSuperAdmin = computed(() => this.authService.hasRole('SUPER_ADMIN'));

  constructor() {
    // Automatically fetch users when filters change
    effect(() => {
      this.fetchUsers();
    });
  }

  async fetchUsers() {
    this.loading.set(true);
    try {
      const res = await this.usersService
        .getAll({
          page: this.page(),
          perPage: this.perPage(),
          search: this.search(),
          role: this.roleFilter() || undefined,
        })
        .toPromise();

      if (res) {
        this.users.set(res.data);
        this.total.set(res.meta.total);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
  }

  onRoleChange(value: string) {
    this.roleFilter.set(value);
    this.page.set(1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
    }
  }

  editUser(id: string) {
    this.router.navigate(['/admin/users', id]);
  }

  // Modal Handlers
  async openCreateModal() {
    this.newUser.set({
      email: '',
      fullName: '',
      password: '',
      roles: ['STUDENT'],
      schoolId: undefined,
    });

    if (this.isSuperAdmin()) {
      try {
        const res = await this.schoolsService.find({ perPage: 100 }).toPromise();
        if (res) this.schools.set(res.data);
      } catch (error) {
        console.error('Failed to fetch schools', error);
      }
    }

    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  async saveUser() {
    const data = this.newUser();
    if (!data.email || !data.fullName || !data.password || !data.roles?.length) {
      this.toastService.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSaving.set(true);
    try {
      await this.usersService.create(data).toPromise();
      this.toastService.success('Tạo người dùng thành công');
      this.closeCreateModal();
      this.fetchUsers(); // Refresh list
    } catch (error: unknown) {
      console.error('Failed to create user', error);
      this.toastService.error(getApiErrorMessage(error, 'Có lỗi xảy ra khi tạo người dùng'));
    } finally {
      this.isSaving.set(false);
    }
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      PROVINCE_ADMIN: 'Admin Tỉnh',
      DISTRICT_ADMIN: 'Admin Huyện',
      SCHOOL_ADMIN: 'Admin Trường',
      CONTENT_CREATOR: 'Soạn thảo',
      CONTENT_REVIEWER: 'Reviewer',
      CONTENT_APPROVER: 'Phê duyệt',
      SUBJECT_TEACHER: 'Giáo viên',
      HOMEROOM_TEACHER: 'GV Chủ nhiệm',
      STUDENT: 'Học sinh',
      PARENT: 'Phụ huynh',
    };
    return labels[role] ?? role;
  }
}
