import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { BlogService, BlogStatus } from '../../../core/services/blog.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    [{ align: [] }],
    ['clean'],
  ],
};

@Component({
  selector: 'app-blog-admin-editor',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, QuillModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-admin-editor.component.html',
  styleUrl: './blog-admin-editor.component.scss',
})
export class BlogAdminEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private authService = inject(AuthService);

  postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
    coverImage: [''],
    tags: [''],
  });

  postId = signal<string | null>(null);
  isEditMode = signal(false);
  saving = signal(false);
  submitting = signal(false);
  postStatus = signal<BlogStatus>('DRAFT');

  readonly quillModules = QUILL_MODULES;

  /** Chỉ CONTENT_APPROVER / SUPER_ADMIN / SCHOOL_ADMIN mới thấy nút Xuất bản */
  readonly canPublish = computed(() =>
    this.authService.hasRole('CONTENT_APPROVER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'),
  );

  /** Nút Gửi duyệt chỉ hiện khi bài ở DRAFT và user là tác giả (chưa có APPROVER role) */
  readonly canSubmitReview = computed(() =>
    this.postStatus() === 'DRAFT' && !this.canPublish(),
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (id && id !== 'new') {
            this.postId.set(id);
            this.isEditMode.set(true);
            return this.blogService.getById(id);
          }
          return of(null);
        }),
        tap((post) => {
          if (post) {
            this.postForm.patchValue({
              title: post.title,
              content: post.content,
              coverImage: post.coverImage ?? '',
              tags: post.tags.join(', '),
            });
            this.postStatus.set(post.status);
          }
        }),
      )
      .subscribe();
  }

  onContentChange(event: { html: string | null }): void {
    this.postForm.patchValue({ content: event.html ?? '' });
  }

  private parseTags(raw: string): string[] {
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  onSave(): void {
    if (this.postForm.invalid) return;
    this.saving.set(true);

    const val = this.postForm.value;
    const payload = {
      title: val.title!,
      content: val.content!,
      coverImage: val.coverImage || undefined,
      tags: this.parseTags(val.tags ?? ''),
    };

    const id = this.postId();
    const request$ =
      id && this.isEditMode()
        ? this.blogService.update(id, payload)
        : this.blogService.create(payload);

    request$.subscribe({
      next: (post) => {
        this.postId.set(post.id);
        this.isEditMode.set(true);
        this.postStatus.set(post.status);
        this.toastService.success(
          this.isEditMode() ? 'Đã lưu bài viết' : 'Đã tạo bài viết',
        );
        this.saving.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Lưu bài viết thất bại'));
        this.saving.set(false);
      },
    });
  }

  async onSubmitForReview(): Promise<void> {
    const id = this.postId();
    if (!id) {
      this.toastService.error('Hãy lưu bài viết trước khi gửi duyệt.');
      return;
    }
    const confirmed = await this.confirmService.confirm({
      title: 'Gửi bài để duyệt',
      message: 'Gửi bài viết này lên để CONTENT_REVIEWER/APPROVER xem xét?',
      confirmText: 'Gửi duyệt',
      type: 'primary',
    });
    if (!confirmed) return;

    this.submitting.set(true);
    this.blogService.submitForReview(id).subscribe({
      next: () => {
        this.postStatus.set('REVIEW');
        this.toastService.success('Đã gửi bài viết lên duyệt!');
        this.submitting.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Gửi duyệt thất bại'));
        this.submitting.set(false);
      },
    });
  }

  async onPublish(): Promise<void> {
    const id = this.postId();
    if (!id) {
      this.toastService.error('Hãy lưu bài viết trước khi xuất bản.');
      return;
    }
    const confirmed = await this.confirmService.confirm({
      title: 'Xuất bản bài viết',
      message: 'Bài viết sẽ hiển thị công khai ngay lập tức. Tiếp tục?',
      confirmText: 'Xuất bản',
      type: 'primary',
    });
    if (!confirmed) return;

    this.blogService.publish(id).subscribe({
      next: () => {
        this.postStatus.set('PUBLISHED');
        this.toastService.success('Đã xuất bản bài viết!');
        this.router.navigate(['/admin/blog']);
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xuất bản thất bại'));
      },
    });
  }
}
