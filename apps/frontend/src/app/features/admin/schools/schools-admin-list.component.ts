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
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { School } from '@eduviet/shared-types';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { GeoTreeComponent, GeoNodeSelected } from '../../../shared/components/geo-tree/geo-tree.component';
import { AuthService } from '../../../core/services/auth.service';
import { getApiErrorMessage } from '../../../core/utils/http-error';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-schools-admin-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    GeoTreeComponent,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schools-admin-list.component.html',
  styleUrl: './schools-admin-list.component.scss',
})
export class SchoolsAdminListComponent implements OnInit {
  private schoolsService = inject(SchoolsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  readonly displayedColumns = ['code', 'name', 'address', 'actions'];

  schools = signal<School[]>([]);
  total = signal(0);
  page = signal(1);
  readonly perPage = 10;
  totalPages = computed(() => Math.ceil(this.total() / this.perPage));

  searchControl = new FormControl('');

  /** Geo filter from tree */
  selectedGeo = signal<GeoNodeSelected | null>(null);
  selectedGeoLabel = computed(() => {
    const geo = this.selectedGeo();
    return geo ? geo.name : 'Tất cả';
  });

  /** Show tree only for admins with geographic scope */
  showGeoTree = computed(() => {
    const role = this.authService.currentRole();
    return (
      role === 'SUPER_ADMIN' ||
      role === 'PROVINCE_ADMIN' ||
      role === 'DISTRICT_ADMIN'
    );
  });

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadSchools();
      });
    this.loadSchools();
  }

  loadSchools(): void {
    const geo = this.selectedGeo();
    this.schoolsService
      .find({
        page: this.page(),
        perPage: this.perPage,
        search: this.searchControl.value || undefined,
        districtId: geo?.type === 'district' ? geo.id : undefined,
      })
      .subscribe((res) => {
        this.schools.set(res.data);
        this.total.set(res.meta.total);
      });
  }

  onGeoSelected(node: GeoNodeSelected): void {
    this.selectedGeo.set(node);
    this.page.set(1);
    this.loadSchools();
  }

  clearGeoFilter(): void {
    this.selectedGeo.set(null);
    this.page.set(1);
    this.loadSchools();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadSchools();
  }

  async onDelete(school: School): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Xóa trường học',
      message: `Xóa trường "${school.name}"? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa',
      type: 'danger',
    });
    if (!confirmed) return;

    this.schoolsService.delete(school.id).subscribe({
      next: () => {
        this.schools.update((list) => list.filter((s) => s.id !== school.id));
        this.total.update((t) => t - 1);
        this.toastService.success('Đã xóa trường học');
      },
      error: (err: unknown) => {
        this.toastService.error(getApiErrorMessage(err, 'Xóa thất bại'));
      },
    });
  }

  trackById(_index: number, school: School): string {
    return school.id;
  }
}
