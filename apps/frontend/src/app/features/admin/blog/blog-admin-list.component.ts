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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DatePipe } from '@angular/common';

const STATUS_LABELS: Record<BlogStatus, string> = {
  DRAFT: 'Nháp',
  REVIEW: 'Đang duyệt',
  APPROVED: 'Đã duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
  REJECTED: 'Bị từ chối',
};

@Component({
  selector: 'app-blog-admin-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-admin-list.component.html',
  styleUrl: './blog-admin-list.component.scss',
})
export class BlogAdminListComponent implements OnInit {
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);

  posts = signal<BlogListItem[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 10;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));
  loading = signal(false);

  searchControl = new FormControl('');
  statusFilter = signal<BlogStatus | ''>('');

  readonly statuses: Array<{ value: BlogStatus | ''; label: string }> = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'REVIEW', label: 'Đang duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'PUBLISHED', label: 'Đã xuất bản' },
    { value: 'ARCHIVED', label: 'Lưu trữ' },
    { value: 'REJECTED', label: 'Bị từ chối' },
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
      .getAll({
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

  onPublish(post: BlogListItem): void {
    if (!confirm(`Xuất bản bài viết "${post.title}"?`)) return;
    this.blogService.publish(post.id).subscribe({
      next: (updated) => {
        this.posts.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.toastService.success('Đã xuất bản bài viết');
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xuất bản thất bại'));
      },
    });
  }

  onDelete(post: BlogListItem): void {
    if (!confirm(`Xóa bài viết "${post.title}"? Thao tác không thể hoàn tác.`)) return;
    this.blogService.delete(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        this.total.update((t) => t - 1);
        this.toastService.success('Đã xóa bài viết');
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xóa thất bại'));
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
