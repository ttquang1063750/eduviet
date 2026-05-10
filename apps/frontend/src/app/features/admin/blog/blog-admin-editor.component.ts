import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { BlogService, BlogStatus } from '../../../core/services/blog.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';
import { switchMap, tap, startWith, map, debounceTime } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

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
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AsyncPipe,
    QuillModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
  ],
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
  private http = inject(HttpClient);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private quillInstance: any = null;

  tagInput = viewChild<ElementRef<HTMLInputElement>>('tagInput');
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
    coverImage: [''],
  });

  tagCtrl = new FormControl('');
  selectedTags = signal<string[]>([]);
  allTags = signal<string[]>([]);
  filteredTags: Observable<string[]>;

  postId = signal<string | null>(null);
  isEditMode = signal(false);
  saving = signal(false);
  submitting = signal(false);
  postStatus = signal<BlogStatus>('DRAFT');
  slugPreview = signal('');

  readonly quillModules = QUILL_MODULES;

  constructor() {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags().slice())),
    );

    // Slug auto-gen
    this.postForm.controls.title.valueChanges
      .pipe(debounceTime(300))
      .subscribe((title) => {
        if (title) {
          this.slugPreview.set(this._buildSlug(title));
        } else {
          this.slugPreview.set('');
        }
      });
  }

  /** Chỉ CONTENT_APPROVER / SUPER_ADMIN / SCHOOL_ADMIN mới thấy nút Xuất bản */
  readonly canPublish = computed(() =>
    this.authService.hasRole('CONTENT_APPROVER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'),
  );

  /** Nút Gửi duyệt chỉ hiện khi bài ở DRAFT và user là tác giả (chưa có APPROVER role) */
  readonly canSubmitReview = computed(() =>
    this.postStatus() === 'DRAFT' && !this.canPublish(),
  );

  ngOnInit(): void {
    // Load popular tags
    this.blogService.getTags().subscribe((tags) => this.allTags.set(tags));

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
            });
            this.selectedTags.set(post.tags);
            this.postStatus.set(post.status);
            this.slugPreview.set(post.slug);
          }
        }),
      )
      .subscribe();
  }

  // ─── Tags Logic ───────────────────────────────────────────────────────────

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.selectedTags.update((tags) => [...new Set([...tags, value])]);
    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    this.selectedTags.update((tags) => tags.filter((t) => t !== tag));
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    this.selectedTags.update((tags) => [...new Set([...tags, event.option.viewValue])]);
    this.tagInput()!.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags().filter((tag) => tag.toLowerCase().includes(filterValue));
  }

  // ─── Slug Logic ───────────────────────────────────────────────────────────

  private _buildSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }

  // ─── Quill image upload ───────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditorCreated(quill: any): void {
    this.quillInstance = quill;
    // Override nút image trong toolbar — upload lên MinIO thay vì nhúng base64
    const toolbar = quill.getModule('toolbar') as { addHandler(name: string, fn: () => void): void };
    toolbar.addHandler('image', () => this.imageUploadHandler());
  }

  private imageUploadHandler(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !this.quillInstance) return;

      const formData = new FormData();
      formData.append('file', file);

      this.http
        .post<{ data: { url: string } }>('/api/storage/upload', formData)
        .subscribe({
          next: ({ data }) => {
            const range = this.quillInstance.getSelection(true) as { index: number };
            this.quillInstance.insertEmbed(range.index, 'image', data.url, 'user');
            this.quillInstance.setSelection(range.index + 1);
          },
          error: () => this.toastService.error('Upload ảnh thất bại'),
        });
    };
  }

  onSave(): void {
    if (this.postForm.invalid) return;
    this.saving.set(true);

    const val = this.postForm.value;
    const payload = {
      title: val.title!,
      content: val.content!,
      coverImage: val.coverImage || undefined,
      tags: this.selectedTags(),
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
        this.slugPreview.set(post.slug);
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

    // Auto-save nội dung hiện tại trước khi publish
    if (this.postForm.invalid) {
      this.toastService.error('Nội dung chưa hợp lệ, vui lòng kiểm tra lại.');
      return;
    }
    this.saving.set(true);
    const val = this.postForm.value;
    const payload = {
      title: val.title!,
      content: val.content!,
      coverImage: val.coverImage || undefined,
      tags: this.selectedTags(),
    };

    this.blogService.update(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
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
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Lưu thất bại trước khi xuất bản'));
        this.saving.set(false);
      },
    });
  }
}
