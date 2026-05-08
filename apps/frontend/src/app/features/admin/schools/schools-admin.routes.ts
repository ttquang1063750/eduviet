import { Route } from '@angular/router';
import { SchoolsAdminListComponent } from './schools-admin-list.component';
import { SchoolsAdminDetailComponent } from './schools-admin-detail.component';

export const SCHOOLS_ADMIN_ROUTES: Route[] = [
  {
    path: '',
    component: SchoolsAdminListComponent,
    title: 'Manage Schools',
  },
  {
    path: 'new',
    component: SchoolsAdminDetailComponent,
    title: 'New School',
  },
  {
    path: ':id',
    component: SchoolsAdminDetailComponent,
    title: 'Edit School',
  },
];
