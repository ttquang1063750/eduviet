import { Route } from '@angular/router';
import { ContentAdminListComponent } from './content-admin-list.component';

export const CONTENT_ADMIN_ROUTES: Route[] = [
  {
    path: '',
    component: ContentAdminListComponent,
    title: 'Content Moderation',
  },
];
