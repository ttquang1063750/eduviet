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
import { GeoTreeComponent, GeoNodeSelected } from '../../../shared/components/geo-tree/geo-tree.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-schools-admin-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GeoTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schools-admin-list.component.html',
  styleUrl: './schools-admin-list.component.scss',
})
export class SchoolsAdminListComponent implements OnInit {
  private schoolsService = inject(SchoolsService);
  private authService = inject(AuthService);

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
}
