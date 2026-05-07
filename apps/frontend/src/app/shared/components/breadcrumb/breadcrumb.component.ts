import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  breadcrumbService = inject(BreadcrumbService);
  breadcrumbs = this.breadcrumbService.breadcrumbs;

  getIcon(label: string): string {
    const icons: Record<string, string> = {
      'Tổng quan': '🏠',
      'Bài học': '📚',
      'Chi tiết': '📖',
      'Người dùng': '👥',
      'Admin': '🛡️',
    };
    return icons[label] || '📍';
  }
}
