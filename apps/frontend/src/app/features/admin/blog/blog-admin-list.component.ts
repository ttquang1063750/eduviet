import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BlogService, BlogListItem, BlogStatus } from '../../../core/services/blog.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DatePipe } from '@angular/common';

const STATUS_LABELS: Record<BlogStatus, string> = {
  DRAFT: $localize`Nháp`,
  REVIEW: $localize`Đang duyệt`,
  APPROVED: $localize`Đã duyệt`,
  PUBLISHED: $localize`Đã xuất bản`,
  ARCHIVED: $localize`Lưu trữ`,
  REJECTED: $localize`Bị từ chối`,
};

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-blog-admin-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatMenuModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-admin-list.component.html',
  styleUrl: './blog-admin-list.component.scss',
})
export class BlogAdminListComponent implements OnInit {
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  posts = signal<BlogListItem[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 10;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));
  loading = signal(false);

  searchControl = new FormControl('');
  statusFilter = signal<BlogStatus | ''>('');

  readonly statuses: Array<{ value: BlogStatus | ''; label: string }> = [
    { value: '', label: $localize`Tất cả trạng thái` },
    { value: 'DRAFT', label: $localize`Nháp` },
    { value: 'REVIEW', label: $localize`Đang duyệt` },
    { value: 'APPROVED', label: $localize`Đã duyệt` },
    { value: 'PUBLISHED', label: $localize`Đã xuất bản` },
    { value: 'ARCHIVED', label: $localize`Lưu trữ` },
    { value: 'REJECTED', label: $localize`Bị từ chối` },
  ];

  statusLabels = STATUS_LABELS;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadPosts();
      });
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.blogService
      .getAdminAll({
        page: this.page(),
        perPage: this.perPage,
        search: this.searchControl.value || undefined,
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.posts.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as BlogStatus | '';
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadPosts();
  }

  async onPublish(post: BlogListItem): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: $localize`Xuất bản bài viết`,
      message: $localize`Xuất bản bài viết "${post.title}"? Bài sẽ hiển thị công khai ngay lập tức.`,
      confirmText: $localize`Xuất bản`,
      type: 'primary',
    });
    if (!confirmed) return;
    this.blogService.publish(post.id).subscribe({
      next: (updated) => {
        this.posts.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.toastService.success($localize`Đã xuất bản bài viết`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Xuất bản thất bại`));
      },
    });
  }

  async onDelete(post: BlogListItem): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: $localize`Xóa bài viết`,
      message: $localize`Xóa bài viết "${post.title}"? Thao tác này không thể hoàn tác.`,
      confirmText: $localize`Xóa`,
      type: 'danger',
    });
    if (!confirmed) return;
    this.blogService.delete(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        this.total.update((t) => t - 1);
        this.toastService.success($localize`Đã xóa bài viết`);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, $localize`Xóa thất bại`));
      },
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadPosts();
  }

  trackById(_index: number, post: BlogListItem): string {
    return post.id;
  }
}
