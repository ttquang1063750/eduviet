---
description: Đọc .claude/task.md, thực thi bước [ ] đầu tiên chưa làm, đánh dấu xong, báo cáo kết quả.
---

## Hành động

1. Đọc `.claude/task.md` — tìm step `[ ]` đầu tiên chưa làm.
2. Đọc `.claude/rules.md` — nhắc lại rules trước khi viết code.
3. Nếu step có dependency (cần step trước xong) mà chưa xong → báo lỗi, không thực thi.

4. **Thực thi đúng 1 step**:
   - Đọc file liên quan trước khi sửa (không bao giờ sửa mù).
   - Viết/sửa code theo đúng rules.md.
   - Kiểm tra TypeScript sơ bộ (đọc lại file vừa tạo, check import/export).
   - Viết test nếu có thể.

5. **Nếu step tạo/sửa Angular component — PHẢI tự kiểm tra checklist sau trước khi đánh dấu done**:
   - [ ] 3 file riêng: `.ts` + `.html` + `.scss` (không inline template, không inline styles)
   - [ ] `changeDetection: ChangeDetectionStrategy.OnPush` có mặt
   - [ ] Dùng `inject()`, không dùng constructor injection
   - [ ] Không import `CommonModule`
   - [ ] Không dùng `any` type
   - [ ] State dùng `signal()` / `computed()` / `input()` / `output()`
   - [ ] Control flow: `@if` / `@for` — không `*ngIf` / `*ngFor`
   - [ ] Không dùng `alert()` / `confirm()` / `prompt()` — dùng `ToastService` / `ConfirmService`
   - [ ] **i18n**: gọi `/i18n-check <file>` để báo cáo text/attribute chưa có marker. Nếu i18n đã setup (`@angular/localize` installed) → BẮT BUỘC fix mọi violation trước khi đánh dấu done. Nếu chưa setup → ghi nhận trong task.md note để fix lúc rollout i18n.

6. **Cập nhật task.md**:
   - Đánh dấu step vừa làm: `[ ]` → `[x]`.
   - Cập nhật "Step hiện tại" sang step tiếp theo.
   - Thêm file vào mục "Files đã tạo/sửa".

7. **Báo cáo**:
   ```
   ✅ Step [N] done: [tên step]
   📁 File: [đường dẫn]
   ⏭ Tiếp theo: Step [N+1] — [tên]
   💡 Ghi chú: [nếu có gì cần lưu ý]
   ```

8. **Sau khi báo cáo — BẮT BUỘC**:
   - Nếu còn step chưa làm → nhắc: **"Gõ `/execute-step` để tiếp tục bước tiếp theo."**
   - Nếu đây là step CUỐI CÙNG → nhắc: **"Task hoàn thành! Gõ `/check-point` để lưu tiến độ."**
   - **KHÔNG tự động làm bước tiếp theo — dừng lại và chờ lệnh.**

## Lưu ý
- **Mỗi lần chỉ làm 1 step — không nhảy cóc, không làm nhiều steps một lúc.**
- Nếu step quá lớn (>150 dòng code mới), đề xuất tách nhỏ hơn.
- Nếu gặp lỗi hoặc cần quyết định thiết kế → dừng, hỏi người dùng, KHÔNG tự quyết.
