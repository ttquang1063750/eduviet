# Active Task: P2 — Sidebar Collapsible

## Mục tiêu
Sidebar có 2 mode: Expanded (260px) và Collapsed (80px, icon only). Toggle bằng nút hamburger, state lưu localStorage.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-13
Step hiện tại: — COMPLETED

---

## Steps

- [x] 1. `core/utils/name-initials.ts` — pure function `getInitials(fullName: string): string`
         "Nguyễn Văn A" → "NVA" (chữ đầu mỗi từ, viết hoa, tối đa 3 ký tự)

- [x] 2. `main-layout.component.ts` — thêm:
         - import getInitials, MatButtonModule
         - `readonly collapsed = signal(localStorage.getItem('sidebar-collapsed') === 'true')`
         - `readonly userInitials = computed(() => getInitials(this.user()?.fullName ?? ''))`
         - `toggleSidebar()`: update signal + localStorage.setItem

- [x] 3. `main-layout.component.html` — update template:
         3a. Sidebar brand: thêm toggle button (mat-icon-button, icon menu/menu_open tùy state)
         3b. `<mat-sidenav [style.width]="collapsed() ? '80px' : '260px'"`
         3c. `.brand-text` [style.display] ẩn khi collapsed
         3d. `.user-info` [style.display] ẩn khi collapsed; avatar tooltip = fullName khi collapsed
             hiện `userInitials()` khi collapsed, `userInitial()` khi expanded
         3e. Mỗi `<a mat-list-item>`: `[matTooltip]="collapsed() ? 'Label' : ''"` + `matTooltipPosition="right"`
         3f. `<span matListItemTitle>` [style.display] ẩn khi collapsed
         3g. `.nav-section-title` [style.display] ẩn khi collapsed

- [x] 4. `main-layout.component.scss` — update styles:
         - `.sidebar`: thêm `transition: width 250ms ease; overflow: hidden`
         - `.sidebar-brand` khi collapsed: center logo
         - `.user-card` khi collapsed: center avatar, smaller padding
         - `.user-avatar` khi collapsed: margin auto

---

## Context quan trọng

### getInitials
```typescript
export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
}
```

### collapsed signal (với localStorage)
```typescript
readonly collapsed = signal(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('sidebar-collapsed') === 'true'
    : false
);

toggleSidebar(): void {
  this.collapsed.update(v => !v);
  localStorage.setItem('sidebar-collapsed', String(this.collapsed()));
}
```

### [style.width] trên mat-sidenav (quan trọng!)
```html
<mat-sidenav mode="side" opened class="sidebar"
  [style.width]="collapsed() ? '80px' : '260px'">
```
Dùng style binding thay CSS class để Angular CDK tự tính lại layout.

### matTooltip pattern cho nav item
```html
<a mat-list-item routerLink="/dashboard"
   [matTooltip]="collapsed() ? 'Tổng quan' : ''"
   matTooltipPosition="right"
   routerLinkActive #rla0="routerLinkActive"
   [activated]="rla0.isActive">
  <mat-icon matListItemIcon>home</mat-icon>
  <span matListItemTitle [style.display]="collapsed() ? 'none' : ''">Tổng quan</span>
</a>
```

### KHÔNG dùng @if để ẩn content trong mat-list-item
→ Dùng [style.display] vì @if block content projection.

## Files sẽ tạo/sửa
- `apps/frontend/src/app/core/utils/name-initials.ts` — tạo mới
- `apps/frontend/src/app/layout/main-layout.component.ts`
- `apps/frontend/src/app/layout/main-layout.component.html`
- `apps/frontend/src/app/layout/main-layout.component.scss`
