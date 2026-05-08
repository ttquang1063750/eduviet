import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ClassesService, ClassItem } from '../../../core/services/classes.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-classes-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <div class="header-actions">
        <h2>Quản lý lớp học</h2>
        <a routerLink="new" class="btn btn-primary">Thêm lớp mới</a>
      </div>

      <div class="filters">
        <input 
          type="text" 
          [formControl]="searchControl" 
          placeholder="Tìm kiếm lớp học..." 
          class="form-control search-input"
        >
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Tên lớp</th>
              <th>Trường</th>
              <th>Giáo viên chủ nhiệm</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cls of classes">
              <td>{{ cls.name }}</td>
              <td>{{ cls.school.name }}</td>
              <td>{{ cls.homeroomTeacher?.fullName || 'N/A' }}</td>
              <td class="actions">
                <a [routerLink]="[cls.id]" class="btn btn-sm btn-outline">Sửa</a>
              </td>
            </tr>
            <tr *ngIf="classes.length === 0">
              <td colspan="4" class="text-center">Không tìm thấy lớp nào.</td>
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
export class ClassesAdminListComponent implements OnInit {
  private classesService = inject(ClassesService);
  
  classes: ClassItem[] = [];
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
      this.loadClasses();
    });

    this.refresh$.subscribe(() => {
      this.loadClasses();
    });
  }

  loadClasses() {
    // We use getAll instead of find to match the actual service method
    this.classesService.getAll({
      page: this.page,
      perPage: this.perPage,
      // Note: backend API for getting classes might not support "search" yet, 
      // but we send what service supports.
    }).subscribe(res => {
      this.classes = res.data;
      this.total = res.meta.total;
    });
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadClasses();
  }
}
