import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { ChatWidgetComponent } from '../features/chat/chat-widget/chat-widget.component';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ConfirmComponent } from '../shared/components/confirm/confirm.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BreadcrumbComponent,
    ChatWidgetComponent,
    ToastComponent,
    ConfirmComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly isAdmin = computed(() =>
    this.authService.hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN')
  );
  readonly isContentRole = computed(() =>
    this.authService.hasRole(
      'CONTENT_CREATOR', 'CONTENT_REVIEWER', 'CONTENT_APPROVER',
      'SUBJECT_TEACHER', 'HOMEROOM_TEACHER'
    )
  );
  readonly canViewReports = computed(() =>
    this.authService.hasRole(
      'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN',
      'HOMEROOM_TEACHER', 'SUBJECT_TEACHER'
    )
  );

  readonly userInitial = computed(() => {
    const parts = (this.user()?.fullName ?? '').split(' ');
    const last = parts[parts.length - 1];
    return last ? last[0].toUpperCase() : '?';
  });

  readonly roleLabel = computed(() => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      PROVINCE_ADMIN: 'Quản trị tỉnh',
      DISTRICT_ADMIN: 'Quản trị huyện',
      SCHOOL_ADMIN: 'Quản trị trường',
      CONTENT_CREATOR: 'Soạn thảo viên',
      CONTENT_REVIEWER: 'Reviewer',
      CONTENT_APPROVER: 'Phê duyệt viên',
      GRADER: 'Chấm điểm',
      HOMEROOM_TEACHER: 'Giáo viên chủ nhiệm',
      SUBJECT_TEACHER: 'Giáo viên bộ môn',
      STUDENT: 'Học sinh',
      PARENT: 'Phụ huynh',
    };
    return labels[this.user()?.role ?? ''] ?? '';
  });

  logout() {
    this.authService.logout().subscribe();
  }
}
