# EduViet — Rules (PHẢI tuân thủ mọi lúc)

> File này là luật bất biến. Mọi code sinh ra đều phải tuân thủ.

## Backend

### Pattern bắt buộc
```
Route handler → Service → Repository → Prisma
```
- Route: chỉ validate Zod + gọi service. Không có business logic.
- Service: RBAC checks, business rules, gọi `writeAuditLog()` sau mỗi mutation.
- Repository: chỉ giao tiếp Prisma, typed selects dùng `satisfies Prisma.XxxSelect`.

### JWT
```typescript
// ĐÚNG — augment @fastify/jwt
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: { id: string; email: string; roles: UserRole[]; }; // MẢNG, không phải đơn
  }
}
```

### Error handling
- Throw `AppError` từ `shared/errors/app-error.ts`, không throw Error thường.
- Không expose stack trace cho client.

### Rate limiting — auth endpoints
```typescript
config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
```

### Security
- Mọi route PHẢI có `preHandler: [authenticate]`.
- Route cần phân quyền PHẢI có `preHandler: [authenticate, authorize('ROLE1', 'ROLE2')]`.
- Audit log cho mọi CRUD mutation nhạy cảm.

## Frontend (Angular 21 Zoneless)

### Component
```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foo.component.html',   // KHÔNG inline template
  styleUrl: './foo.component.scss',       // KHÔNG inline styles
})
export class FooComponent {
  private svc = inject(FooService);      // inject(), không constructor
}
```

### Quy tắc cứng
- 3 file riêng: `.ts` + `.html` + `.scss` — KHÔNG inline.
- `OnPush` trên MỌI component.

### ❌ TUYỆT ĐỐI KHÔNG inline template hoặc styles trong `.ts`

```typescript
// ❌ SAI — inline template
@Component({
  template: `<div>{{ title }}</div>`,  // cấm
})

// ❌ SAI — inline styles
@Component({
  styles: [`h1 { color: red }`],       // cấm
})

// ❌ SAI — kết hợp cả hai
@Component({
  template: `<h1>...</h1>`,
  styles: [`.card { padding: 1rem }`],
})

// ✅ ĐÚNG — 3 file riêng biệt
@Component({
  templateUrl: './foo.component.html',
  styleUrl: './foo.component.scss',
})
```

**Lý do:**
- Code review khó — HTML/CSS chôn trong TS file
- i18n extract không hoạt động với inline templates
- ESLint rule `no-inline-declarations` sẽ báo lỗi nếu vi phạm
- IDE support (syntax highlighting, formatting) kém hơn với file riêng
- `inject()` thay constructor injection.
- Signals cho state: `signal()`, `computed()`, `input()`, `output()`.
- Control flow: `@if`, `@for` — KHÔNG `*ngIf`, `*ngFor`.
- Không dùng `any` type.
- Không import `CommonModule`.
- `provideZonelessChangeDetection()` đã có trong app.config.ts — không thêm zone.js.
- **KHÔNG dùng** `alert()`, `confirm()`, `prompt()` của trình duyệt.
  - Dùng `ConfirmService.confirm()` (trả về `Promise<boolean>`) cho các hộp thoại xác nhận.

### ❌ Deprecated — TUYỆT ĐỐI KHÔNG DÙNG (Angular 19+)

#### App/Environment initializers
```typescript
// ❌ SAI — deprecated từ Angular v19
{ provide: APP_INITIALIZER, useFactory: ..., deps: [...], multi: true }
{ provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(Svc), multi: true }

// ✅ ĐÚNG
provideAppInitializer(() => {
  const svc = inject(MyService);
  return svc.init(); // có thể trả về Promise hoặc Observable
})
provideEnvironmentInitializer(() => {
  inject(MyService); // eager-init, không await
})
```

#### RxJS import path
```typescript
// ❌ SAI — legacy path từ RxJS 6, sẽ bị xóa trong RxJS 8
import { map, switchMap } from 'rxjs/operators';

// ✅ ĐÚNG — import trực tiếp từ 'rxjs' (RxJS 7+)
import { map, switchMap } from 'rxjs';
```

#### Input/Output decorators
```typescript
// ❌ SAI — legacy decorator style
@Input() title: string = '';
@Output() saved = new EventEmitter<void>();

// ✅ ĐÚNG — signal-based API (Angular 17+)
title = input<string>('');
saved = output<void>();
```

#### ViewChild/ViewChildren decorators
```typescript
// ❌ SAI — legacy decorator style
@ViewChild('canvas') canvasRef!: ElementRef;
@ViewChildren(MyComp) items!: QueryList<MyComp>;

// ✅ ĐÚNG — signal-based API (Angular 17+)
canvasRef = viewChild.required<ElementRef>('canvas');
// dùng: this.canvasRef().nativeElement
```

#### Template $any()
```typescript
// ❌ SAI — bypass type system, vi phạm no-any
@for (item of $any(list); track item.id)

// ✅ ĐÚNG — non-null assertion khi @if đã guard, hoặc ?? []
@for (item of list!; track item.id)
@for (item of list ?? []; track item.id)
```

#### Các NgModule đã thay bằng providers
```typescript
// ❌ SAI
imports: [CommonModule, BrowserModule, HttpClientModule, BrowserAnimationsModule]

// ✅ ĐÚNG — dùng providers trong app.config.ts
provideHttpClient(withFetch(), withInterceptors([...]))
provideAnimationsAsync()
// CommonModule không cần trong standalone components (dùng built-in @if/@for)
```

### UI/UX Standards (Angular Material 3)
- **TẤT CẢ** các thành phần UI (input, button, select, checkbox, radio...) PHẢI dùng **Angular Material Design 3**.
- **Theme**: Sử dụng Material 3 với **High Density** (`density: -3`).
- **Màu**: Dùng CSS custom properties từ theme — `var(--mat-sys-primary)`, `var(--mat-sys-on-primary)`, v.v. KHÔNG hardcode màu hex khi có token tương đương.
- **Quy định Component**:
  - Form Fields: Dùng `mat-form-field` với `appearance="outline"`.
  - Buttons: `mat-flat-button` cho hành động chính, `mat-stroked-button` cho hành động phụ, `mat-icon-button` cho thao tác nhanh.
  - Phân trang & Bảng: Dùng `mat-table` và `mat-paginator`.
  - Tooltip: `matTooltip` — KHÔNG dùng attribute `title=` trên Material components.
  - Icons: `<mat-icon>` — KHÔNG dùng emoji làm icon trong UI.
- **KHÔNG** tự viết CSS cho các input/button cơ bản trừ khi cần tinh chỉnh layout đặc thù.
- **TUYỆT ĐỐI KHÔNG dùng `::ng-deep`** — deprecated, phá vỡ ViewEncapsulation, gây style leak. Thay bằng:
  - Đặt style trên host element (`.host-class { font-size: 0.75rem }`) → Material child inherit
  - Dùng `styles.scss` global scope nếu cần override Material internals project-wide
  - Dùng Angular Material theming tokens (`mat.theme()`, `--mat-*` CSS vars) cho customization đúng cách

### i18n bắt buộc cho mọi UI mới
- **TẤT CẢ** text hiển thị cho user — text node, attribute (placeholder, aria-label, title, alt, matTooltip), và string trong TS (toast, confirm, error message) — PHẢI có marker i18n:
  ```html
  <!-- ✅ ĐÚNG — text node: dùng i18n bare, Angular auto-generate ID -->
  <h2 i18n>Chào mừng trở lại</h2>

  <!-- ✅ ĐÚNG — attribute tĩnh -->
  <input i18n-placeholder placeholder="example@eduviet.vn" />

  <!-- ✅ ĐÚNG — TS dynamic message ($localize không cần @@id) -->
  this.toast.error($localize`Đã có lỗi xảy ra`);
  ```
- **KHÔNG bỏ qua** binding `{{ }}`, comment, ký tự đặc biệt — chỉ text có chữ cái cần i18n.
- **Workflow**: sau khi tạo/sửa template → gọi `/i18n-check <file>` để verify. Nếu `@angular/localize` đã install → BẮT BUỘC pass trước khi commit.

### i18n — Quy tắc cụ thể

#### Luôn dùng `i18n` bare — KHÔNG dùng `@@id`
```html
<!-- ✅ ĐÚNG -->
<span i18n>Tổng quan</span>
<p i18n>Nền tảng học tập trực tuyến dành cho học sinh Việt Nam</p>
<input i18n-placeholder placeholder="Tìm kiếm..." />
<div i18n-aria-label aria-label="Công cụ vẽ"></div>

<!-- ❌ SAI — verbose, không cần thiết -->
<span i18n="@@nav.dashboard">Tổng quan</span>
<input i18n-placeholder="@@search.placeholder" placeholder="Tìm kiếm..." />
```

#### Dynamic bindings — KHÔNG dùng `$localize` cho UX phụ
```html
<!-- ✅ ĐÚNG — tooltip là UX phụ, không cần i18n (đã có <span i18n> bên dưới) -->
[matTooltip]="collapsed() ? 'Tổng quan' : ''"
<span matListItemTitle i18n>Tổng quan</span>

<!-- ❌ SAI — over-engineering, tạo object $localize thừa trong component TS -->
readonly i18nLabels = { dashboard: $localize`:Tổng quan` };
[matTooltip]="collapsed() ? i18nLabels.dashboard : ''"
```
- `$localize` trong TS chỉ dùng khi chuỗi **bắt buộc phải dịch** và **không thể dùng `i18n` attribute** (vd: toast messages, error messages trong service).

#### Không cần dịch
- Brand name: `EduViet`, `EduViet Blog`
- Language switcher labels: `VI`, `EN` (tên ngôn ngữ hiển thị native)
- Icon names: `<mat-icon>home</mat-icon>` (không phải text hiển thị)
- Binding-only values: `{{ user()?.fullName }}`, `{{ currentYear }}`

## Prisma / Database
- UUID primary key: `@id @default(uuid())`.
- Timestamps: `createdAt`, `updatedAt`, `deletedAt` (soft delete).
- Tên bảng: `@@map("snake_case_plural")`.
- Index cho mọi FK và field thường filter.
- **KHÔNG dùng** `rejectOnNotFound` (removed Prisma v4), `$use()` middleware (deprecated), `findOne()` (removed Prisma v3).

## TypeScript chung
- Không dùng `any`.
- Không dùng `as unknown as X` trừ khi thực sự cần thiết (comment lý do).
- Không dùng `as any` để workaround type lỗi — fix type đúng cách (thêm field vào interface, dùng type guard, v.v.).
- Shared types đặt trong `packages/shared-types/src/`.
- Unused args phải prefix `_` (vd: `_event`, `_q`) để ESLint không báo lỗi.


#### Animation providers — không cần, không dùng
```typescript
// ❌ SAI — deprecated từ v20.2, project không dùng animations
provideAnimations()
provideAnimationsAsync()

// ✅ ĐÚNG — không cần provider nào, Angular Material dùng CSS transitions
// Không import gì từ @angular/platform-browser/animations
```
