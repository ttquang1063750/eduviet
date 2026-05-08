import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);

  private _breadcrumbs = signal<BreadcrumbItem[]>([]);
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  private _dynamicLabels = new Map<string, string>();

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const root = this.router.routerState.root;
        const breadcrumbs: BreadcrumbItem[] = [];
        this.addBreadcrumb(root, [], breadcrumbs);
        this._breadcrumbs.set(breadcrumbs);
      });
  }

  setLabel(url: string, label: string) {
    this._dynamicLabels.set(url, label);
    // Refresh breadcrumbs to reflect changes immediately
    const root = this.router.routerState.root;
    const breadcrumbs: BreadcrumbItem[] = [];
    this.addBreadcrumb(root, [], breadcrumbs);
    this._breadcrumbs.set(breadcrumbs);
  }

  private addBreadcrumb(route: ActivatedRoute | null, url: string[], breadcrumbs: BreadcrumbItem[]) {
    if (!route) return;

    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) return;

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL !== '') {
        url.push(routeURL);
      }

      const fullUrl = `/${url.join('/')}`;
      let label = child.snapshot.data['breadcrumb'];

      // Check for dynamic label override
      if (this._dynamicLabels.has(fullUrl)) {
        label = this._dynamicLabels.get(fullUrl);
      } else if (child.snapshot.data['breadcrumbAlias'] && this._dynamicLabels.has(child.snapshot.data['breadcrumbAlias'])) {
        label = this._dynamicLabels.get(child.snapshot.data['breadcrumbAlias']);
      }

      // Chỉ push nếu label tồn tại VÀ url này chưa có trong danh sách.
      // Angular kế thừa data từ route cha xuống child path:'' → tránh duplicate.
      const alreadyAdded = breadcrumbs.some((b) => b.url === fullUrl);
      if (label && !alreadyAdded) {
        breadcrumbs.push({ label, url: fullUrl });
      }

      this.addBreadcrumb(child, url, breadcrumbs);
    }
  }
}
