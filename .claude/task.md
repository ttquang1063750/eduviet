# Active Task: Refactor Schools & Classes Admin — mat-table + nested routes

## Mục tiêu
Chuyển toàn bộ giao diện quản trị trường/lớp/học sinh sang Angular Material Table (`mat-table`) và tổ chức lại routes theo cấu trúc phân cấp: School → Classes → Students. Tách edit form ra khỏi list page.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-12
Step hiện tại: 17 — [FE] classes-admin-list.component.html — mat-table

---

## Phase 1 — Schools List → mat-table

- [x] 1. [FE] `schools-admin-list.component.ts` — thêm MatTableModule, MatSortModule; signal `displayedColumns`; thêm `onDelete(school)` + inject ConfirmService/ToastService
- [x] 2. [FE] `schools-admin-list.component.html` — toolbar trên cùng (search + geo filter + nút "Tạo trường mới"); `<mat-table>` với columns: name, code, address, actions (nút edit → `/schools/:id`, nút classes → `/schools/:id/classes`, nút delete)
- [x] 3. [FE] `schools-admin-list.component.scss` — table styles, action buttons inline

---

## Phase 2 — Schools Detail — edit school only (bỏ class list)

- [x] 4. [FE] `schools-admin-detail.component.ts` — xóa ClassesService, schoolClasses signal, loadClasses(), goToCreateClass(); giữ form + save + delete
- [x] 5. [FE] `schools-admin-detail.component.html` — xóa toàn bộ section classes; chỉ giữ school form + nút Save/Delete

---

## Phase 3 — Routes restructure

- [x] 6. [FE] `schools-admin.routes.ts` — thêm routes con:
  - `':id/classes'` → `SchoolClassesListComponent` (lazy)
  - `':id/classes/new'` → `SchoolClassDetailComponent` (lazy)
  - `':id/classes/:classId'` → `SchoolClassDetailComponent` (lazy)
  - `':id/classes/:classId/students'` → `SchoolClassStudentsComponent` (lazy)

---

## Phase 4 — School Classes List (trang mới)

- [x] 7. [FE] Tạo `school-classes-list.component.ts` — inject ClassesService; `schoolId` từ `ActivatedRoute params`; load classes filter theo schoolId; mat-table signals; `onDelete(cls)` + ConfirmService
- [x] 8. [FE] Tạo `school-classes-list.component.html` — header breadcrumb "Trường X / Lớp học"; toolbar + nút "Tạo lớp mới"; `<mat-table>` columns: name, grade, academicYear, homeroomTeacher, studentCount, actions (edit → `../:classId`, students → `../:classId/students`, delete)
- [x] 9. [FE] Tạo `school-classes-list.component.scss`

---

## Phase 5 — School Class Detail (trang mới — edit/create class)

- [x] 10. [FE] Tạo `school-class-detail.component.ts` — adapt từ `classes-admin-detail`; `schoolId` pre-fill từ route param `/:id`; sau save navigate về `../` (classes list); không có students section
- [x] 11. [FE] Tạo `school-class-detail.component.html` — form: name, grade, academicYear, homeroomTeacherId (autocomplete); nút Save + Delete + Back
- [x] 12. [FE] Tạo `school-class-detail.component.scss`

---

## Phase 6 — School Class Students (trang mới)

- [x] 13. [FE] Tạo `school-class-students.component.ts` — inject ClassesService; `classId` từ route; load students + mat-table; search panel "Thêm học sinh" (reuse pattern từ classes-admin-detail hiện có); onRemove + onAdd
- [x] 14. [FE] Tạo `school-class-students.component.html` — header breadcrumb 3 cấp; toolbar + "Thêm học sinh" toggle panel; `<mat-table>` columns: avatar, name, email, actions (remove); search panel với infinite scroll
- [x] 15. [FE] Tạo `school-class-students.component.scss`

---

## Phase 7 — Global Classes List → mat-table

- [x] 16. [FE] `classes-admin-list.component.ts` — thêm MatTableModule; `displayedColumns`; thêm `onDelete(cls)`; "Edit" navigate → `/admin/schools/:schoolId/classes/:id`
- [x] 17. [FE] `classes-admin-list.component.html` — replace với `<mat-table>`; columns: name, grade, school, academicYear, actions (edit → school-scoped URL, delete); chú ý: không có nút "Tạo mới" (phải vào qua school)
- [x] 18. [FE] `classes-admin-list.component.scss`

---

## Context quan trọng

### Route params
- `schools/:id` → `schoolId` dùng `ActivatedRoute.snapshot.paramMap.get('id')`
- `schools/:id/classes/:classId` → cả `schoolId` lẫn `classId` cần thiết
- Dùng `this.route.parent!.snapshot.paramMap.get('id')` để lấy schoolId trong component con

### mat-table pattern (Angular Material)
```typescript
// imports
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

// component
displayedColumns = ['name', 'code', 'address', 'actions'];
dataSource = signal<School[]>([]);

// template
<mat-table [dataSource]="dataSource()">
  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef>Tên trường</mat-header-cell>
    <mat-cell *matCellDef="let row">{{ row.name }}</mat-cell>
  </ng-container>
  <ng-container matColumnDef="actions">
    <mat-header-cell *matHeaderCellDef></mat-header-cell>
    <mat-cell *matCellDef="let row">
      <button mat-icon-button [routerLink]="[row.id]"><mat-icon>edit</mat-icon></button>
      <button mat-icon-button [routerLink]="[row.id, 'classes']"><mat-icon>school</mat-icon></button>
      <button mat-icon-button color="warn" (click)="onDelete(row)"><mat-icon>delete</mat-icon></button>
    </mat-cell>
  </ng-container>
  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns"></mat-row>
</mat-table>
```

### Lazy loading trong routes
```typescript
{
  path: ':id/classes',
  loadComponent: () =>
    import('./school-classes-list.component').then(m => m.SchoolClassesListComponent),
  title: 'Lớp học',
},
```

### Quy tắc bắt buộc
- OnPush, inject(), signals, @if/@for
- 3 file riêng (ts/html/scss)
- ConfirmService cho delete (không dùng confirm() browser)
- Breadcrumb data trong route nếu cần
- Không có any

## Files đã tạo/sửa
(Điền khi thực thi)

## Bước tiếp theo sau task này
Không còn backlog kỹ thuật — nhận feature request mới từ stakeholders.

---

## Snapshot (checkpoint 2026-05-12 — giữa task)
- **Đã xong: 15/18 steps** — Phase 1–6 hoàn thành
- Phase 1: schools-admin-list → mat-table ✅
- Phase 2: schools-admin-detail → edit only ✅
- Phase 3: routes restructure (4 nested routes) ✅
- Phase 4: SchoolClassesListComponent (mat-table) ✅
- Phase 5: SchoolClassDetailComponent (edit class) ✅
- Phase 6: SchoolClassStudentsComponent (mat-table + add panel) ✅
- **Còn lại: Phase 7** — steps 16–18 (classes-admin-list → mat-table)
- **Tiếp theo:** `/execute-step` để làm step 16
