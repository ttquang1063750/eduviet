---
description: Tạo feature mới end-to-end theo kiến trúc chuẩn của EduViet
argument-hint: "<tên tính năng hoặc mô tả>"
---

Hãy xây dựng tính năng mới cho dự án EduViet theo đúng kiến trúc và conventions trong CLAUDE.md.

Tính năng cần tạo: $ARGUMENTS

**Yêu cầu bắt buộc:**
1. Đọc CLAUDE.md để nắm conventions
2. Đọc agent `feature-builder` tại `.claude/agents/feature-builder.md`
3. Xác định rõ: entities, API endpoints, RBAC roles, Angular components
4. Tạo theo thứ tự: Migration → Backend (route+service+repo+schema) → Shared types → Frontend (component+service)
5. Viết unit tests cho service layer và component
6. Chạy security checklist tại cuối

Bắt đầu bằng cách hỏi tôi nếu cần thêm thông tin về nghiệp vụ.
