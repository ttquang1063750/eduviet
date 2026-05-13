# Active Task: UI Refactor — Breadcrumb + Shared SCSS + Angular Material

## Mục tiêu
1. Fix bug `BreadcrumbService` kế thừa label từ route cha → xóa được dual navigation
2. Xóa inline `<nav class="breadcrumb">` ở 3 school sub-components, dùng service thay thế
3. Extract SCSS trùng lặp vào shared partial `_admin-shared.scss`
4. Replace HTML element thuần bằng Angular Material component trên toàn admin

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-13
Step hiện tại: 13 — main-layout: mat-sidenav + mat-nav-list + mat-icon

---

## Phase 1 — Fix BreadcrumbService (root cause)

- [x] 1. `breadcrumb.service.ts` — đổi `child.snapshot.data['breadcrumb']` → `child.snapshot.routeConfig?.data?.['breadcrumb']` để ngăn kế thừa từ ancestor; cập nhật `breadcrumb.component.ts` `getIcon()` map đủ tất cả routes

## Phase 2 — Thêm breadcrumb data vào routes

- [x] 2. `schools-admin.routes.ts` — thêm `data: { breadcrumb: '...' }`:
  - `''` → không cần (cha đã có 'Trường học')
  - `'new'` → `{ breadcrumb: 'Thêm trường mới' }`
  - `':id'` → `{ breadcrumb: 'Chỉnh sửa trường' }`
  - `':id/classes'` → `{ breadcrumb: 'Lớp học' }`
  - `':id/classes/new'` → `{ breadcrumb: 'Tạo lớp mới' }`
  - `':id/classes/:classId'` → `{ breadcrumb: 'Chỉnh sửa lớp' }`
  - `':id/classes/:classId/students'` → `{ breadcrumb: 'Học sinh' }`

## Phase 3 — Xóa inline nav, dùng BreadcrumbService.setLabel()

- [x] 3. `school-classes-list` (ts + html + scss):
  - ts: inject BreadcrumbService; sau khi `schoolsService.findById()` thành công → `breadcrumbService.setLabel('/admin/schools/' + id, school.name)`
  - html: xóa toàn bộ `<nav class="breadcrumb">...</nav>`
  - scss: xóa block `.breadcrumb { ... }`

- [x] 4. `school-class-detail` (ts + html + scss):
  - ts: inject BreadcrumbService; sau load school → setLabel school; sau load class → setLabel class URL
  - html: xóa `<nav class="breadcrumb">`
  - scss: xóa `.breadcrumb`

- [x] 5. `school-class-students` (ts + html + scss):
  - ts: inject BreadcrumbService; setLabel sau khi load
  - html: xóa `<nav class="breadcrumb">`
  - scss: xóa `.breadcrumb`

## Phase 4 — Shared SCSS partial

- [x] 6. Tạo `src/app/styles/_admin-shared.scss`:
  ```scss
  // Admin card wrapper
  .admin-card { background: white; border-radius: 12px; ... }

  // Toolbar
  .toolbar { display: flex; justify-content: space-between; ... }
  .toolbar__title { ... }
  .toolbar__actions { ... }

  // Count badge
  .count-badge { ... }

  // mat-table common
  .table-wrapper { overflow-x: auto; }
  // header cell uppercase style — dùng :host ::ng-deep hoặc global
  .mat-mdc-header-cell { font-weight: 600; text-transform: uppercase; ... }

  // Empty state
  .no-data-row { display: block; }
  .no-data-cell { display: flex; align-items: center; justify-content: center; ... }

  // Pagination
  .pagination { display: flex; justify-content: center; ... }

  // Actions column
  .actions-header, .actions-cell { width: 140px; text-align: right; ... }

  // Form layout (detail pages)
  .form-card { background: white; border-radius: 12px; ... }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; ... }
  .form-actions { display: flex; gap: 1rem; padding-top: 1.5rem; ... }

  // Detail page header
  .detail-header { display: flex; justify-content: space-between; ... }
  ```

- [x] 7. `schools-admin-list.component.scss` — thêm `@use '../../../styles/admin-shared' as shared;` (hoặc forward), xóa: `.admin-card`, `.toolbar`, `.toolbar__*`, `.count-badge`, `.table-wrapper`, `.mat-mdc-header-cell`, `.actions-header/.actions-cell`, `.no-data-row/.no-data-cell`, `.pagination` — chỉ giữ class riêng của file: `.schools-layout`, `.geo-panel`, `.schools-table`, `.code-badge`, `.school-name`, `.address-text`, `.search-field`

- [x] 8. `school-classes-list.component.scss` — tương tự, chỉ giữ: `.classes-page`, `.classes-table`, `.grade-badge`, `.teacher-name`, `.no-teacher`, `.student-count`, `.search-field`

- [x] 9. `school-class-students.component.scss` — chỉ giữ: `.students-page`, `.add-panel`, `.panel-loading`, `.panel-empty`, `.student-result`, `.students-table`, `.avatar*`, `.student-name/email`

- [x] 10. `school-class-detail.component.scss` — chỉ giữ: `.detail-page`, `.teacher-email`

- [x] 11. `classes-admin-list.component.scss` — chỉ giữ: `.classes-table`, `.class-name`, `.grade-badge`, `.school-link`, `.student-count`, `.search-field`, `.create-hint`, `.loading-bar`

- [x] 12. `schools-admin-detail.component.scss` — chỉ giữ: `.detail-page`

## Phase 5 — Replace HTML thuần → Angular Material

- [ ] 13. `main-layout.component` (html + ts + scss):
  - `<nav class="sidebar">` → `<mat-sidenav-container>` + `<mat-sidenav>` + `<mat-sidenav-content>`
  - `<ul class="nav-list">` + `<li class="nav-item">` → `<mat-nav-list>` + `<mat-list-item>` + `[routerLink]`
  - `<span class="nav-icon">emoji</span>` → `<mat-icon>icon_name</mat-icon>` (map emoji → Material icon name)
  - `<button class="logout-btn">` → `<button mat-list-item color="warn">`
  - Emoji map: 🏠→home, 📚→menu_book, 🎓→school, 📰→article, 📊→bar_chart, 👥→group, 🏛️→account_balance, 🏫→domain, 📐→calculate, ✏️→edit, 🗂️→folder_open, 📖→book, ✅→fact_check, 🚪→logout

- [ ] 14. Admin features — scan các component trong `features/admin/` còn dùng HTML element thuần:
  - `<button>` không có mat-directive → thêm `mat-button` / `mat-icon-button` / `mat-flat-button`
  - `<select>` thuần → `<mat-select>` trong `<mat-form-field>`
  - `<input type="text">` không có `matInput` → thêm `matInput`
  - Tooltip thuần (`title="..."`) → `[matTooltip]="..."`

---

## Context quan trọng

### BreadcrumbService fix
```typescript
// TRƯỚC (bug — kế thừa từ cha):
let label = child.snapshot.data['breadcrumb'];

// SAU (chỉ lấy data của route hiện tại):
let label = child.snapshot.routeConfig?.data?.['breadcrumb'] as string | undefined;
```

### setLabel pattern
```typescript
// Sau khi load school:
this.breadcrumbService.setLabel(`/admin/schools/${schoolId}`, school.name);
// Sau khi load class:
this.breadcrumbService.setLabel(`/admin/schools/${schoolId}/classes/${classId}`, cls.name);
```

### mat-sidenav-container pattern
```html
<mat-sidenav-container class="app-layout">
  <mat-sidenav mode="side" opened class="sidebar">
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
        <mat-icon matListItemIcon>home</mat-icon>
        <span matListItemTitle>Tổng quan</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>
  <mat-sidenav-content class="main-content">
    <app-breadcrumb />
    <router-outlet />
  </mat-sidenav-content>
</mat-sidenav-container>
```

### _admin-shared.scss — dùng @use hoặc global
Vì Angular scoped styles, các class mat-table như `.mat-mdc-header-cell` cần dùng `::ng-deep` hoặc đặt trong `styles.scss` global. Cân nhắc đặt table styles vào `styles.scss` global thay vì partial.

### Emoji → Material icon mapping (step 13)
| Emoji | Material Icon |
|-------|--------------|
| 🏠 | home |
| 📚 | menu_book |
| 🎓 | school |
| 📰 | article |
| 📊 | bar_chart |
| 👥 | group |
| 🏛️ | account_balance |
| 🏫 | domain |
| 📐 | calculate |
| ✏️ | edit_note |
| 🗂️ | folder_open |
| 📖 | book |
| ✅ | fact_check |
| 🚪 | logout |

## Files đã tạo/sửa
- `apps/frontend/src/app/core/services/breadcrumb.service.ts` — fix routeConfig?.data
- `apps/frontend/src/app/shared/components/breadcrumb/breadcrumb.component.ts` — update getIcon() map
- `apps/frontend/src/app/features/admin/schools/schools-admin.routes.ts` — thêm data breadcrumb 6 routes
- `apps/frontend/src/app/features/admin/schools/school-classes-list.component.html` — xóa inline nav, thêm toolbar subtitle
- `apps/frontend/src/app/features/admin/schools/school-classes-list.component.scss` — xóa .breadcrumb, thêm __title-group/__subtitle
- `apps/frontend/src/app/features/admin/schools/school-class-detail.component.html` — xóa inline nav
- `apps/frontend/src/app/features/admin/schools/school-class-detail.component.scss` — xóa .breadcrumb block
- `apps/frontend/src/app/features/admin/schools/school-class-students.component.html` — xóa inline nav, thêm subtitle
- `apps/frontend/src/app/features/admin/schools/school-class-students.component.scss` — xóa .breadcrumb, thêm __title-group/__subtitle
- `apps/frontend/src/app/styles/_admin-shared.scss` — tạo mới: admin-card, toolbar, count-badge, table-wrapper, no-data, pagination, detail-header, form-card/grid/actions
- `apps/frontend/src/styles.scss` — thêm global mat-table header/row hover styles
- `apps/frontend/src/app/features/admin/schools/schools-admin-list.component.scss` — @use partial, xóa 7 duplicated blocks (80 dòng → 65 dòng)

## Bước tiếp theo sau task này
P2 — Sidebar Collapsible (80px min mode, icon-only, initials)

---

## Snapshot (checkpoint 2026-05-13 — giữa task)
- **Đã xong: 12/14 steps** — Phase 1–4 hoàn thành
- Phase 1: Fix BreadcrumbService inheritance bug ✅
- Phase 2: schools-admin.routes.ts breadcrumb data ✅
- Phase 3: Xóa 3 inline nav (school-classes-list, school-class-detail, school-class-students) ✅
- Phase 4: _admin-shared.scss + @use vào 6 SCSS files (−550 dòng duplicate) ✅
- **Còn lại: Phase 5** — steps 13–14 (main-layout mat-sidenav + admin HTML replace)
- **Tiếp theo:** `/resume` rồi `/execute-step` để làm step 13
