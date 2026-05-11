import { Routes } from '@angular/router';

export const LESSONS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lesson-admin-list.component').then((m) => m.LessonAdminListComponent),
  },
  {
    path: 'new',
    data: { breadcrumb: 'Tạo bài học mới' },
    loadComponent: () =>
      import('./components/lesson-admin-editor.component').then((m) => m.LessonAdminEditorComponent),
  },
  {
    path: ':id/edit',
    data: { breadcrumb: 'Chỉnh sửa bài học' },
    loadComponent: () =>
      import('./components/lesson-admin-editor.component').then((m) => m.LessonAdminEditorComponent),
  },
  {
    path: ':id/exercises',
    data: { breadcrumb: 'Trình biên soạn câu hỏi' },
    loadComponent: () =>
      import('./exercise-editor/exercise-editor.component').then((m) => m.ExerciseEditorComponent),
  },
];
