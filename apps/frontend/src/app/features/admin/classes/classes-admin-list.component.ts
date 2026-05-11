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
import { ClassesService, ClassItem } from '../../../core/services/classes.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-classes-admin-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './classes-admin-list.component.html',
  styleUrl: './classes-admin-list.component.scss',
})
export class ClassesAdminListComponent implements OnInit {
  private classesService = inject(ClassesService);

  classes = signal<ClassItem[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 10;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  searchControl = new FormControl('');

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.page.set(1);
      this.loadClasses();
    });
    this.loadClasses();
  }

  loadClasses(): void {
    this.classesService.getAll({
      page: this.page(),
      perPage: this.perPage,
    }).subscribe(res => {
      this.classes.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadClasses();
  }
}
