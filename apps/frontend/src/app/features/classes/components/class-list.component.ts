import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ClassesService, ClassItem } from '../../../core/services/classes.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss',
})
export class ClassListComponent implements OnInit {
  private classesService = inject(ClassesService);
  private fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly classes = signal<ClassItem[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly grades = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly filterForm = this.fb.nonNullable.group({
    grade: [''],
    academicYear: [''],
  });

  ngOnInit() {
    this.loadClasses();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadClasses();
      });
  }

  loadClasses() {
    this.loading.set(true);
    const { grade, academicYear } = this.filterForm.getRawValue();

    this.classesService.getAll({
      page: this.page(),
      perPage: 20,
      grade: grade ? parseInt(grade) : undefined,
      academicYear: academicYear || undefined,
    }).subscribe({
      next: (res) => {
        this.classes.set(res.data);
        this.totalPages.set(res.meta.totalPages);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadClasses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
