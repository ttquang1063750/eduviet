# Design Spec: Hệ thống Breadcrumb Navigation cho EduViet

## 1. Tổng quan
Hệ thống Breadcrumb giúp người dùng dễ dàng định vị vị trí của mình trong ứng dụng và quay lại các cấp độ cao hơn một cách nhanh chóng. Hệ thống này tuân thủ phong cách thiết kế Flat Illustration của dự án.

## 2. Mục tiêu & Tiêu chí thành công
- Hiển thị đường dẫn điều hướng chính xác theo phân cấp Route.
- Hỗ trợ đổi tên động (ví dụ: hiển thị tên bài học cụ thể thay vì chữ "Chi tiết").
- Giao diện đồng bộ với phong cách Flat Illustration (dạng thẻ/pills với đổ bóng cứng).
- Cải thiện trải nghiệm người dùng (UX) và tính nhất quán trên toàn ứng dụng.

## 3. Kiến trúc hệ thống

### A. Layout Structure (MainLayout)
Tạo `MainLayoutComponent` làm khung sườn chung cho các trang yêu cầu đăng nhập.
- **Sidebar:** Bên trái (giữ nguyên logic hiện tại).
- **Header:** Chứa thông tin người dùng.
- **Breadcrumb:** Nằm ngay dưới Header, phía trên `router-outlet`.
- **Content Area:** Nơi render các component con qua `router-outlet`.

### B. Breadcrumb Service
Sử dụng `BreadcrumbService` để quản lý trạng thái:
- Sử dụng Angular Signals (`Signal<BreadcrumbItem[]>`) để lưu trữ danh sách các mục.
- Lắng nghe `NavigationEnd` để tự động xây dựng danh sách dựa trên `ActivatedRoute`.
- Cung cấp phương thức `setLabel(alias: string, label: string)` để cập nhật tên động.

### C. Giao diện (UI/UX)
- **Component:** `BreadcrumbComponent` (Standalone).
- **Styling:**
    - Container: Flexbox, gap 8-12px.
    - Pill: `background: #FFF`, `border: 2px solid #E1E8F0`, `border-radius: 50px`, `box-shadow: 4px 4px 0px #E1E8F0`.
    - Active Pill: `border-color: #4A90E2`, `color: #4A90E2`.
    - Separator: Dấu `/` hoặc icon mũi tên.

## 4. Kỹ thuật triển khai

### Route Configuration
Cập nhật `app.routes.ts` để thêm thuộc tính `data.breadcrumb`:
```typescript
{
  path: 'lessons',
  data: { breadcrumb: 'Bài học' },
  children: [
    { path: ':slug', data: { breadcrumb: 'Chi tiết' } }
  ]
}
```

### Dynamic Labeling
Trong `LessonDetailComponent`:
```typescript
ngOnInit() {
  this.lessonService.getLesson(slug).subscribe(lesson => {
    this.breadcrumbService.setLabel('lessons/:slug', lesson.title);
  });
}
```

## 5. Kế hoạch kiểm thử (Test Plan)
- **Unit Test:** Kiểm tra `BreadcrumbService` sinh ra đúng danh sách item dựa trên URL.
- **Integration Test:** Đảm bảo khi click vào một item trên Breadcrumb, ứng dụng điều hướng đúng trang.
- **UI Test:** Kiểm tra hiển thị đúng phong cách Flat Illustration trên các kích thước màn hình khác nhau (Responsive).

## 6. Tự đánh giá (Self-Review)
- [x] Không có TBD/TODO.
- [x] Kiến trúc nhất quán với Angular 19 (Signals, Standalone).
- [x] Phạm vi tập trung vào Breadcrumb và Layout, không ảnh hưởng logic nghiệp vụ khác.
- [x] Đã giải quyết vấn đề tên động.
