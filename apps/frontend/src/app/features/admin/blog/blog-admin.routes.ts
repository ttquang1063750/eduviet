import { Routes } from '@angular/router';

export const blogAdminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./blog-admin-list.component').then((m) => m.BlogAdminListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./blog-admin-editor.component').then((m) => m.BlogAdminEditorComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./blog-admin-editor.component').then((m) => m.BlogAdminEditorComponent),
  },
];
