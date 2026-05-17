import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ContentModerationService } from '../../../core/services/content-moderation.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { BlogPost } from '@eduviet/shared-types';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-content-admin-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-admin-list.component.html',
  styleUrl: './content-admin-list.component.scss',
})
export class ContentAdminListComponent implements OnInit {
  private moderationService = inject(ContentModerationService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  pendingContent = signal<BlogPost[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 10;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  ngOnInit(): void {
    this.loadPendingContent();
  }

  loadPendingContent(): void {
    this.moderationService.findPending({
      page: this.page(),
      perPage: this.perPage,
    }).subscribe(res => {
      this.pendingContent.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadPendingContent();
  }

  async approve(_id: string): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: $localize`Xác nhận duyệt`,
      message: $localize`Bạn có chắc chắn muốn duyệt bài viết này?`,
      confirmText: $localize`Duyệt bài`,
    });

    if (confirmed) {
      // this.moderationService.approve(id).subscribe(() => this.loadPendingContent());
      this.toastService.success($localize`Thao tác duyệt được giả lập`);
    }
  }

  async reject(_id: string): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: $localize`Xác nhận từ chối`,
      message: $localize`Bạn có chắc chắn muốn từ chối bài viết này?`,
      confirmText: $localize`Từ chối`,
      type: 'danger',
    });

    if (confirmed) {
      // this.moderationService.reject(id, reason).subscribe(() => this.loadPendingContent());
      this.toastService.info($localize`Thao tác từ chối được giả lập`);
    }
  }
}
