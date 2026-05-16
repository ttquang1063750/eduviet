import { Route } from '@angular/router';
import { SchoolsAdminListComponent } from './schools-admin-list.component';
import { SchoolsAdminDetailComponent } from './schools-admin-detail.component';

export const SCHOOLS_ADMIN_ROUTES: Route[] = [
  {
    path: '',
    component: SchoolsAdminListComponent,
    title: 'Quản lý trường học',
    // Không cần breadcrumb — cha (app.routes.ts) đã có label 'Trường học'
  },
  {
    path: 'new',
    component: SchoolsAdminDetailComponent,
    title: 'Thêm trường mới',
    data: { breadcrumb: 'Thêm trường mới' },
  },
  {
    path: ':id',
    component: SchoolsAdminDetailComponent,
    title: 'Chỉnh sửa trường',
    data: { breadcrumb: 'Chỉnh sửa trường' },
  },
  {
    path: ':id/classes',
    loadComponent: () =>
      import('./school-classes-list.component').then(
        (m) => m.SchoolClassesListComponent,
      ),
    title: 'Lớp học của trường',
    data: { breadcrumb: 'Lớp học' },
  },
  {
    path: ':id/classes/new',
    loadComponent: () =>
      import('./school-class-detail.component').then(
        (m) => m.SchoolClassDetailComponent,
      ),
    title: 'Tạo lớp học mới',
    data: { breadcrumb: 'Tạo lớp mới' },
  },
  {
    path: ':id/classes/:classId',
    loadComponent: () =>
      import('./school-class-detail.component').then(
        (m) => m.SchoolClassDetailComponent,
      ),
    title: 'Chỉnh sửa lớp học',
    data: { breadcrumb: 'Chỉnh sửa lớp' },
  },
  {
    path: ':id/classes/:classId/students',
    loadComponent: () =>
      import('./school-class-students.component').then(
        (m) => m.SchoolClassStudentsComponent,
      ),
    title: 'Danh sách học sinh',
    data: { breadcrumb: 'Học sinh' },
  },
];
