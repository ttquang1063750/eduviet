import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BlogService, BlogListItem } from '../../../core/services/blog.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private blogService = inject(BlogService);
  private fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly posts = signal<BlogListItem[]>([]);
  readonly topViewed = signal<BlogListItem[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly filterForm = this.fb.nonNullable.group({ search: [''], tag: [''] });

  ngOnInit() {
    this.blogService.getTopViewed(3).subscribe((posts) => this.topViewed.set(posts));
    this.loadPosts();
    this.filterForm.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => { this.page.set(1); this.loadPosts(); });
  }

  loadPosts() {
    this.loading.set(true);
    const { search, tag } = this.filterForm.getRawValue();
    this.blogService.getAll({ page: this.page(), perPage: 9, status: 'PUBLISHED', search: search || undefined, tag: tag || undefined }).subscribe({
      next: (res) => {
        this.posts.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
