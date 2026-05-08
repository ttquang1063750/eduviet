import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentModerationService } from '../../../core/services/content-moderation.service';
import { BlogPost } from '@eduviet/shared-types';

@Component({
  selector: 'app-content-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-container">
      <div class="header-actions">
        <h2>Kiểm duyệt nội dung (Blog)</h2>
      </div>

      <div class="tabs">
        <button class="tab active">Chờ duyệt</button>
        <!-- Other tabs like 'Đã duyệt', 'Đã từ chối' could go here -->
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of pendingContent">
              <td>{{ item.title }}</td>
              <td>{{ item.authorId }}</td>
              <td>{{ item.createdAt | date:'shortDate' }}</td>
              <td class="actions">
                <button (click)="approve(item.id)" class="btn btn-sm btn-success">Duyệt</button>
                <button (click)="reject(item.id)" class="btn btn-sm btn-danger">Từ chối</button>
                <a [routerLink]="['/blog', item.slug]" target="_blank" class="btn btn-sm btn-outline">Xem</a>
              </td>
            </tr>
            <tr *ngIf="pendingContent.length === 0">
              <td colspan="4" class="text-center">Không có nội dung nào chờ duyệt.</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination" *ngIf="total > perPage">
        <button 
          [disabled]="page === 1" 
          (click)="onPageChange(page - 1)"
          class="btn btn-sm"
        >Trước</button>
        <span>Trang {{ page }} / {{ Math.ceil(total / perPage) }}</span>
        <button 
          [disabled]="page >= Math.ceil(total / perPage)" 
          (click)="onPageChange(page + 1)"
          class="btn btn-sm"
        >Sau</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 20px; }
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .tabs { margin-bottom: 20px; display: flex; gap: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .tab { padding: 8px 16px; background: none; border: none; cursor: pointer; font-size: 16px; color: #6b7280; }
    .tab.active { color: #3b82f6; border-bottom: 2px solid #3b82f6; font-weight: 600; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background-color: #f9fafb; font-weight: 600; }
    .actions { display: flex; gap: 8px; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
    .btn { padding: 8px 16px; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; border: none; }
    .btn-sm { padding: 4px 8px; font-size: 14px; }
    .btn-success { background-color: #10b981; color: white; }
    .btn-danger { background-color: #ef4444; color: white; }
    .btn-outline { border: 1px solid #d1d5db; background: transparent; color: #374151; }
  `]
})
export class ContentAdminListComponent implements OnInit {
  private moderationService = inject(ContentModerationService);
  
  pendingContent: BlogPost[] = [];
  total = 0;
  page = 1;
  perPage = 10;
  
  Math = Math;

  ngOnInit() {
    this.loadPendingContent();
  }

  loadPendingContent() {
    this.moderationService.findPending({
      page: this.page,
      perPage: this.perPage
    }).subscribe(res => {
      this.pendingContent = res.data;
      this.total = res.meta.total;
    });
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadPendingContent();
  }

  approve(id: string) {
    if (confirm('Bạn có chắc chắn muốn duyệt bài viết này?')) {
      // Simulate API call for now since backend might not have the endpoints
      alert('Thao tác duyệt được giả lập');
      // this.moderationService.approve(id).subscribe(() => this.loadPendingContent());
    }
  }

  reject(id: string) {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason !== null) {
      // Simulate API call
      alert('Thao tác từ chối được giả lập với lý do: ' + reason);
      // this.moderationService.reject(id, reason).subscribe(() => this.loadPendingContent());
    }
  }
}
