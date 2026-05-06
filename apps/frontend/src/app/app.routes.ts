import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

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
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'lessons',
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
        loadComponent: () =>
          import('./features/lessons/components/lesson-detail.component').then(
            (m) => m.LessonDetailComponent
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users-admin.component').then(
            (m) => m.UsersAdminComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
