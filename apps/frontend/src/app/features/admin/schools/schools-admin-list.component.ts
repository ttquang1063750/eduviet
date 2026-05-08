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
import { SchoolsService } from '../../../core/services/schools.service';
import { School } from '@eduviet/shared-types';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-schools-admin-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schools-admin-list.component.html',
  styleUrl: './schools-admin-list.component.scss',
})
export class SchoolsAdminListComponent implements OnInit {
  private schoolsService = inject(SchoolsService);

  schools = signal<School[]>([]);
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
      this.loadSchools();
    });
    this.loadSchools();
  }

  loadSchools(): void {
    this.schoolsService.find({
      page: this.page(),
      perPage: this.perPage,
      search: this.searchControl.value || undefined,
    }).subscribe(res => {
      this.schools.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadSchools();
  }
}
