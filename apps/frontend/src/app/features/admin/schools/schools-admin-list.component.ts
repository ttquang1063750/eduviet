import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SchoolsService } from '../../../core/services/schools.service';
import { School } from '@eduviet/shared-types';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-schools-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <div class="header-actions">
        <h2>Quản lý trường học</h2>
        <a routerLink="new" class="btn btn-primary">Thêm trường mới</a>
      </div>

      <div class="filters">
        <input 
          type="text" 
          [formControl]="searchControl" 
          placeholder="Tìm kiếm trường..." 
          class="form-control search-input"
        >
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên trường</th>
              <th>Địa chỉ</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let school of schools">
              <td>{{ school.code }}</td>
              <td>{{ school.name }}</td>
              <td>{{ school.address }}</td>
              <td class="actions">
                <a [routerLink]="[school.id]" class="btn btn-sm btn-outline">Sửa</a>
              </td>
            </tr>
            <tr *ngIf="schools.length === 0">
              <td colspan="4" class="text-center">Không tìm thấy trường nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination" *ngIf="total > perPage">
        <button 
          [disabled]="page === 1" 
          (click)="onPageChange(page - 1)"
          class="btn btn-sm"
        >Trước</button>
        <span>Trang {{ page }} / {{ Math.ceil(total / perPage) }}</span>
        <button 
          [disabled]="page >= Math.ceil(total / perPage)" 
          (click)="onPageChange(page + 1)"
          class="btn btn-sm"
        >Sau</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 20px; }
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .filters { margin-bottom: 20px; }
    .search-input { max-width: 300px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background-color: #f9fafb; font-weight: 600; }
    .actions { display: flex; gap: 8px; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
    .btn { padding: 8px 16px; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-primary { background-color: #3b82f6; color: white; border: none; }
    .btn-sm { padding: 4px 8px; font-size: 14px; }
    .btn-outline { border: 1px solid #d1d5db; background: transparent; color: #374151; }
  `]
})
export class SchoolsAdminListComponent implements OnInit {
  private schoolsService = inject(SchoolsService);
  
  schools: School[] = [];
  total = 0;
  page = 1;
  perPage = 10;
  
  searchControl = new FormControl('');
  private refresh$ = new BehaviorSubject<void>(undefined);
  
  Math = Math;

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadSchools();
    });

    this.refresh$.subscribe(() => {
      this.loadSchools();
    });
  }

  loadSchools() {
    this.schoolsService.find({
      page: this.page,
      perPage: this.perPage,
      search: this.searchControl.value || undefined
    }).subscribe(res => {
      this.schools = res.data;
      this.total = res.meta.total;
    });
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadSchools();
  }
}
