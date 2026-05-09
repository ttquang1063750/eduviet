import { Routes } from '@angular/router';

export const subjectsAdminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./subjects-admin.component').then((m) => m.SubjectsAdminComponent),
  },
];
