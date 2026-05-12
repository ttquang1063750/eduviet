import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';
import { BlogLayoutComponent } from './layout/blog-layout/blog-layout.component';

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
  // ── Blog routes (layout riêng, không cần đăng nhập) ─────────────────────
  {
    path: 'blog',
    component: BlogLayoutComponent,
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
        loadComponent: () =>
          import('./features/blog/components/blog-detail.component').then(
            (m) => m.BlogDetailComponent
          ),
      },
    ],
  },
  // ── Protected routes (yêu cầu đăng nhập) ─────────────────────────────────
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
      // ── Student Dashboard ────────────────────────────────────────
      {
        path: 'student',
        data: { breadcrumb: 'Trang của tôi', breadcrumbAlias: 'student' },
        canActivate: [roleGuard('STUDENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOMEROOM_TEACHER', 'SUBJECT_TEACHER')],
        loadComponent: () =>
          import('./features/student-dashboard/student-dashboard.component').then(
            (m) => m.StudentDashboardComponent
          ),
      },
      // ── Reports ─────────────────────────────────────────────────
      {
        path: 'reports',
        data: { breadcrumb: 'Báo cáo' },
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      // ── Admin ─────────────────────────────────────────────────
      {
        path: 'admin',
        data: { breadcrumb: 'Admin' },
        children: [
          {
            path: 'users',
            data: { breadcrumb: 'Người dùng' },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/admin/users/users-admin.component').then(
                    (m) => m.UsersAdminComponent
                  ),
              },
              {
                path: ':id',
                data: { breadcrumb: 'Chi tiết', breadcrumbAlias: 'admin/users/:id' },
                loadComponent: () =>
                  import('./features/admin/users/users-admin-detail.component').then(
                    (m) => m.UsersAdminDetailComponent
                  ),
              },
            ],
          },
          {
            path: 'schools',
            data: { breadcrumb: 'Trường học' },
            loadChildren: () =>
              import('./features/admin/schools/schools-admin.routes').then(
                (m) => m.SCHOOLS_ADMIN_ROUTES
              ),
          },
          {
            path: 'classes',
            data: { breadcrumb: 'Lớp học' },
            loadChildren: () =>
              import('./features/admin/classes/classes-admin.routes').then(
                (m) => m.CLASSES_ADMIN_ROUTES
              ),
          },
          {
            path: 'content',
            data: { breadcrumb: 'Kiểm duyệt' },
            loadChildren: () =>
              import('./features/admin/content/content-admin.routes').then(
                (m) => m.CONTENT_ADMIN_ROUTES
              ),
          },
          {
            path: 'subjects',
            data: { breadcrumb: 'Môn học' },
            loadChildren: () =>
              import('./features/admin/subjects/subjects-admin.routes').then(
                (m) => m.subjectsAdminRoutes
              ),
          },
          {
            path: 'blog',
            data: { breadcrumb: 'Blog' },
            loadChildren: () =>
              import('./features/admin/blog/blog-admin.routes').then(
                (m) => m.blogAdminRoutes
              ),
          },
          {
            path: 'questions',
            data: { breadcrumb: 'Ngân hàng câu hỏi' },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/admin/questions/questions-admin.component').then(
                    (m) => m.QuestionsAdminComponent
                  ),
              },
              {
                path: 'new',
                data: { breadcrumb: 'Tạo mới' },
                loadComponent: () =>
                  import(
                    './features/admin/questions/question-editor/question-editor.component'
                  ).then((m) => m.QuestionEditorComponent),
              },
              {
                path: ':id/edit',
                data: { breadcrumb: 'Chỉnh sửa' },
                loadComponent: () =>
                  import(
                    './features/admin/questions/question-editor/question-editor.component'
                  ).then((m) => m.QuestionEditorComponent),
              },
            ],
          },
          {
            path: 'lessons',
            data: { breadcrumb: 'Quản lý bài học' },
            loadChildren: () =>
              import('./features/admin/lessons/lessons-admin.routes').then(
                (m) => m.LESSONS_ADMIN_ROUTES
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
