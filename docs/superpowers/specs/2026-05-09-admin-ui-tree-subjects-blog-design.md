# Design Spec: Admin UI — Geographic Tree, Subjects, Blog

**Date:** 2026-05-09  
**Status:** Approved  
**Scope:** Subsystem A (Geographic Tree + School/Class), B (Subjects Admin), C (Blog Admin)  
**Approach:** Shared `<app-geo-tree>` component + enhance existing routes + 2 new feature modules

---

## 1. Shared Geo-Tree Component

**Location:** `apps/frontend/src/app/shared/components/geo-tree/`  
**Files:** `geo-tree.component.ts` + `.html` + `.scss` (3 file, OnPush, signals)

### Inputs / Outputs
```typescript
maxDepth = input<'district' | 'school' | 'class'>('district');
// nodeSelected emits khi user click một node
nodeSelected = output<{ type: 'nation' | 'province' | 'district'; id: string; name: string }>();
```

### Behavior
- Render 3 level: Nation → Province → District
- School và Class **không** nằm trong cây — chúng là list riêng được filter bởi node đang chọn
- Lazy-load children khi expand lần đầu (gọi API theo từng level)
- Expand/collapse với animation
- Node đang chọn được highlight

### RBAC Scoping (tự động từ AuthService)
| Role | Mount point |
|------|-------------|
| SUPER_ADMIN | Nation (thấy toàn bộ) |
| PROVINCE_ADMIN | Province của mình |
| DISTRICT_ADMIN | District của mình |
| SCHOOL_ADMIN | Bỏ qua cây địa lý — không dùng component này |

### Backend API cần cho Tree
```
GET /api/nations
GET /api/provinces?nationId=
GET /api/districts?provinceId=
```
Nếu chưa có, bổ sung vào module mới `geo.routes.ts`.

---

## 2. Schools CRUD Enhancement (`/admin/schools`)

### Layout
Trang 2 cột:
- **Sidebar trái (~280px):** `<app-geo-tree maxDepth="district">` — chọn District để filter
- **Content phải:** Danh sách schools thuộc District đang chọn, nút "Tạo trường mới"

### Form tạo / sửa trường (modal)
| Field | Type | Ghi chú |
|-------|------|---------|
| Tên trường | text, required | |
| Mã trường | text, required | unique |
| District | pre-fill từ tree | disabled nếu đến từ tree context |
| Địa chỉ | text | |
| Số điện thoại | text | |
| Email | email | |

---

## 3. Classes CRUD Enhancement (`/admin/classes`)

### Form tạo lớp mới — 2 field bổ sung so với hiện tại

**School picker:**
- Dropdown có search
- SCHOOL_ADMIN: pre-fill + disabled (chỉ thấy trường mình)
- Các role khác: load tất cả schools có quyền, có thể search theo tên

**Teacher picker (Giáo viên chủ nhiệm):**
- Chỉ load sau khi đã chọn School
- Gọi `GET /api/users?role=HOMEROOM_TEACHER&schoolId=<id>`
- Hiển thị: `Tên — email` để phân biệt
- Optional — có thể để trống và assign sau

### Các field còn lại
| Field | Type | Ghi chú |
|-------|------|---------|
| Tên lớp | text, required | VD: "10A1" |
| Khối (grade) | number 1–12, required | |
| Năm học | text, required | format "2024-2025" |
| Trường | dropdown search | xem trên |
| Giáo viên chủ nhiệm | dropdown search | optional |

### Backend cần bổ sung
```
GET /api/users?role=HOMEROOM_TEACHER&schoolId=<id>
```
Users module hiện có, chỉ cần thêm query param `schoolId` vào route filter.

---

## 4. Subjects Admin (`/admin/subjects`)

**RBAC:** SUPER_ADMIN + CONTENT_APPROVER được CRUD. Các role khác: read-only.

### List view
Bảng: icon · màu · tên (VI) · tên (EN) · mã code · actions (Edit / Delete)  
Không cần pagination (số môn < 20). Nút "Thêm môn học" góc phải trên.

### Form tạo / sửa (modal)

| Field | Type | Ghi chú |
|-------|------|---------|
| SubjectCode | dropdown enum | MATH, PHYSICS, CHEMISTRY... |
| Tên tiếng Việt | text, required | |
| Tên tiếng Anh | text, required | |
| Màu sắc | color picker | hex string |
| Icon URL | text | URL ảnh hoặc emoji |

**Auto-suggest flow:**
1. User chọn SubjectCode
2. Bấm nút "Gợi ý tự động" → FE gọi `GET /api/subjects/suggest?code=MATH`
3. BE gọi AI (Claude API), trả về `{ name, nameEn, color, iconUrl }`
4. Kết quả điền vào form — user chỉnh nếu muốn, rồi Save
5. Auto-suggest là helper UX — không bắt buộc

**Delete:** Soft delete nếu Subject đã có Lesson liên kết. Nếu chưa có Lesson → hard delete.

### Backend cần bổ sung
```
POST   /api/subjects          — tạo mới (SUPER_ADMIN, CONTENT_APPROVER)
PUT    /api/subjects/:id      — cập nhật
DELETE /api/subjects/:id      — xóa (soft nếu có lesson)
GET    /api/subjects/suggest?code=  — AI suggest (SUPER_ADMIN only)
```

---

## 5. Blog Admin (`/admin/blog`)

**RBAC:** CONTENT_CREATOR tạo/sửa bài của mình. CONTENT_APPROVER duyệt tại `/admin/content` (đã có).

### List view (`/admin/blog`)
Bảng bài viết của user hiện tại: tiêu đề · status badge · ngày tạo · Edit · Delete  
Filter theo status: All / Draft / In Review / Published

### Editor (`/admin/blog/new`, `/admin/blog/:id/edit`)
Trang riêng (không phải modal), layout 2 cột:

**Cột trái (~70%) — Editor:**
- Thư viện: **Quill.js** via `ngx-quill`
- Toolbar: H2, H3, bold, italic, blockquote, ordered/unordered list, link, image upload
- Image upload gọi `POST /api/storage/upload` (MinIO, đã có)

**Cột phải (~30%) — Metadata panel:**
| Field | Ghi chú |
|-------|---------|
| Tiêu đề | text, required |
| Slug | tự động generate từ tiêu đề, editable |
| Ảnh bìa | upload qua MinIO |
| Tóm tắt | textarea ngắn (SEO description) |

**Action buttons:**
- **Lưu nháp** — save với `status: DRAFT`, silent (không toast)
- **Gửi duyệt** — save với `status: REVIEW`, toast "Đã gửi duyệt"
- **Xem trước** — mở `/blog/:slug` trong tab mới

CONTENT_CREATOR không thể publish trực tiếp — phải qua CONTENT_APPROVER.

### Backend
Blog module đã có đầy đủ routes. Kiểm tra `POST /api/blog` có nhận `status: 'DRAFT'` không — nếu chưa thì cập nhật Zod schema để cho phép.

---

## 6. Routing bổ sung

```typescript
// app.routes.ts — thêm vào admin children
{ path: 'subjects', loadChildren: () => import('./features/admin/subjects/subjects-admin.routes') },
{ path: 'blog',     loadChildren: () => import('./features/admin/blog/blog-admin.routes') },
```

Sidebar `MainLayoutComponent` thêm 2 link mới: "Môn học" và "Quản lý Blog".

---

## 7. Files cần tạo / sửa

### Shared
- `shared/components/geo-tree/geo-tree.component.{ts,html,scss}`

### Backend
- `modules/geo/geo.routes.ts` — GET nations/provinces/districts
- `modules/subjects/subjects.routes.ts` — bổ sung POST/PUT/DELETE/suggest
- `modules/subjects/subjects.service.ts` — bổ sung CRUD + AI suggest
- `modules/users/users.routes.ts` — thêm query param `schoolId`

### Frontend
- `features/admin/schools/` — thêm geo-tree sidebar
- `features/admin/classes/` — thêm school picker + teacher picker
- `features/admin/subjects/` — toàn bộ mới (list + modal)
- `features/admin/blog/` — toàn bộ mới (list + editor)
- `layout/main-layout.component.html` — thêm 2 sidebar links

---

## 8. Dependencies cần cài

```bash
# Frontend
pnpm --filter @eduviet/frontend add ngx-quill quill
pnpm --filter @eduviet/frontend add -D @types/quill
```

---

## Thứ tự implement (theo dependency)

1. Backend: geo routes + subjects CRUD routes + users schoolId filter
2. Shared: `<app-geo-tree>` component
3. Frontend: Schools enhancement (dùng geo-tree)
4. Frontend: Classes enhancement (school picker + teacher picker)
5. Frontend: Subjects admin
6. Frontend: Blog admin editor
