import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { ChatWidgetComponent } from '../features/chat/chat-widget/chat-widget.component';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ConfirmComponent } from '../shared/components/confirm/confirm.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { getInitials } from '../core/utils/name-initials';

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
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private authService = inject(AuthService);

  readonly user = this.authService.user;

  // ─── Sidebar collapsed state (persisted) ───────────────────────────────────
  readonly collapsed = signal(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  toggleSidebar(): void {
    this.collapsed.update(v => !v);
    localStorage.setItem('sidebar-collapsed', String(this.collapsed()));
  }

  // ─── Role / display helpers ────────────────────────────────────────────────
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
  readonly isStudent = computed(() =>
    this.authService.hasRole('STUDENT', 'HOMEROOM_TEACHER', 'SUBJECT_TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN')
  );

  /** Chữ cái đầu họ tên — hiện trong avatar khi expanded */
  readonly userInitial = computed(() => {
    const parts = (this.user()?.fullName ?? '').split(' ');
    const last = parts[parts.length - 1];
    return last ? last[0].toUpperCase() : '?';
  });

  /** Chữ viết tắt họ tên — hiện trong avatar khi collapsed (vd: NVA) */
  readonly userInitials = computed(() =>
    getInitials(this.user()?.fullName ?? '')
  );

  readonly roleLabel = computed(() => {
    const u = this.user();
    // Ưu tiên hiển thị chức danh tự do nếu có
    if (u?.title) return u.title;
    // Fallback: nhãn của role đầu tiên
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
    const primaryRole = u?.roles?.[0] ?? '';
    return labels[primaryRole] ?? '';
  });

  logout() {
    this.authService.logout().subscribe();
  }
}
