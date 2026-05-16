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
      // Chung
      'Tổng quan': '🏠',
      'Bài học': '📚',
      'Blog': '📰',
      'Báo cáo': '📊',
      'Trang của tôi': '🎓',
      // Admin top-level
      'Admin': '🛡️',
      'Người dùng': '👥',
      'Trường học': '🏛️',
      'Lớp học': '🏫',
      'Môn học': '📐',
      'Blog (quản trị)': '✏️',
      'Ngân hàng câu hỏi': '🗂️',
      'Quản lý bài học': '📖',
      'Kiểm duyệt': '✅',
      // Detail / action pages
      'Chi tiết': '📋',
      'Thêm trường mới': '➕',
      'Chỉnh sửa trường': '✏️',
      'Tạo lớp mới': '➕',
      'Chỉnh sửa lớp': '✏️',
      'Học sinh': '👤',
    };
    return icons[label] ?? '📍';
  }
}
