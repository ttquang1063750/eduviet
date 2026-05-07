import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { BlogService, BlogPost, Comment } from '../../../core/services/blog.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private breadcrumbService = inject(BreadcrumbService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly post = signal<BlogPost | null>(null);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly replyingTo = signal<string | null>(null); // commentId đang reply

  readonly isLoggedIn = computed(() => !!this.authService.user());
  readonly totalComments = computed(
    () => (this.post()?.comments ?? []).reduce((acc, c) => acc + 1 + c.replies.length, 0)
  );

  readonly commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
  });

  readonly replyForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
  });

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug')!;
        this.loading.set(true);
        return this.blogService.getBySlug(slug);
      })
    ).subscribe({
      next: (res) => {
        this.post.set(res.data);
        this.breadcrumbService.setLabel('blog/:slug', res.data.title);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không thể tải bài viết.');
        this.loading.set(false);
      },
    });
  }

  submitComment() {
    if (this.commentForm.invalid || this.submitting()) return;
    const postId = this.post()?.id;
    if (!postId) return;

    this.submitting.set(true);
    this.blogService.addComment(postId, this.commentForm.controls.content.value).subscribe({
      next: (res) => {
        const current = this.post();
        if (current) {
          this.post.set({ ...current, comments: [res.data, ...current.comments] });
        }
        this.commentForm.reset();
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }

  startReply(commentId: string) {
    this.replyingTo.set(commentId);
    this.replyForm.reset();
  }

  cancelReply() { this.replyingTo.set(null); }

  submitReply(parentId: string) {
    if (this.replyForm.invalid || this.submitting()) return;
    const postId = this.post()?.id;
    if (!postId) return;

    this.submitting.set(true);
    this.blogService.addComment(postId, this.replyForm.controls.content.value, parentId).subscribe({
      next: (res) => {
        const current = this.post();
        if (current) {
          const updatedComments = current.comments.map((c): Comment =>
            c.id === parentId ? { ...c, replies: [...c.replies, res.data] } : c
          );
          this.post.set({ ...current, comments: updatedComments });
        }
        this.replyingTo.set(null);
        this.replyForm.reset();
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}
