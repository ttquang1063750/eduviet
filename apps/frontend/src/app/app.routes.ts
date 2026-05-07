import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/components/login.component').then((m) => m.LoginComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Trang chủ' },
    children: [
      {
        path: 'dashboard',
        data: { breadcrumb: 'Tổng quan' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      // ── Bài học ──────────────────────────────────────────────
      {
        path: 'lessons',
        data: { breadcrumb: 'Bài học' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/lessons/components/lesson-list.component').then(
                (m) => m.LessonListComponent
              ),
          },
          {
            path: ':slug',
            data: { breadcrumb: 'Chi tiết', breadcrumbAlias: 'lessons/:slug' },
            loadComponent: () =>
              import('./features/lessons/components/lesson-detail.component').then(
                (m) => m.LessonDetailComponent
              ),
          },
        ],
      },
      // ── Lớp học ──────────────────────────────────────────────
      {
        path: 'classes',
        data: { breadcrumb: 'Lớp học' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/classes/components/class-list.component').then(
                (m) => m.ClassListComponent
              ),
          },
          {
            path: ':id',
            data: { breadcrumb: 'Chi tiết lớp', breadcrumbAlias: 'classes/:id' },
            loadComponent: () =>
              import('./features/classes/components/class-detail.component').then(
                (m) => m.ClassDetailComponent
              ),
          },
        ],
      },
      // ── Blog ─────────────────────────────────────────────────
      {
        path: 'blog',
        data: { breadcrumb: 'Blog' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/blog/components/blog-list.component').then(
                (m) => m.BlogListComponent
              ),
          },
          {
            path: ':slug',
            data: { breadcrumb: 'Bài viết', breadcrumbAlias: 'blog/:slug' },
            loadComponent: () =>
              import('./features/blog/components/blog-detail.component').then(
                (m) => m.BlogDetailComponent
              ),
          },
        ],
      },
      // ── Admin ─────────────────────────────────────────────────
      {
        path: 'admin',
        data: { breadcrumb: 'Admin' },
        children: [
          {
            path: 'users',
            data: { breadcrumb: 'Người dùng' },
            loadComponent: () =>
              import('./features/admin/users/users-admin.component').then(
                (m) => m.UsersAdminComponent
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
