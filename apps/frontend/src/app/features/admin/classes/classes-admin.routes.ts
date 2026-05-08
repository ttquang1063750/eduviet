import { Route } from '@angular/router';
import { ClassesAdminListComponent } from './classes-admin-list.component';
import { ClassesAdminDetailComponent } from './classes-admin-detail.component';

export const CLASSES_ADMIN_ROUTES: Route[] = [
  {
    path: '',
    component: ClassesAdminListComponent,
    title: 'Manage Classes',
  },
  {
    path: 'new',
    component: ClassesAdminDetailComponent,
    title: 'New Class',
  },
  {
    path: ':id',
    component: ClassesAdminDetailComponent,
    title: 'Edit Class',
  },
];
