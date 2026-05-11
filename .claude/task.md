# Active Task: Không có task kỹ thuật tồn đọng

## Trạng thái: IDLE
Cập nhật: 2026-05-11 (session 15)

Tất cả P1–P3 trong backlog đã hoàn thành. Các session gần đây tập trung vào UX polish và bug fixes.

---

## Đã hoàn thành gần đây (session 14–15)

- ✅ School → Class → Student flow (danh sách lớp trong trang trường, quản lý học sinh trong lớp)
- ✅ Angular Material density fix (xóa `indigo-pink.css` prebuilt theme khỏi angular.json)
- ✅ Chat input fix (`[(ngModel)]` signal binding)
- ✅ Chat real-time delivery fix (private socket room `user:<userId>` + `room_invited` event)
- ✅ Tạo cuộc hội thoại mới từ chat widget (search user → getOrCreateOneOnOne)
- ✅ Xoá chat room (BE cascade delete + FE nút hover + socket broadcast)
- ✅ Chat search error handling (catchError → không pending vô tận khi 401/403)

---

## Gợi ý bước tiếp theo (nếu muốn mở rộng)

1. **Notification push** khi có tin nhắn mới (browser Notification API)
2. **Đọc đã đọc (read receipts)** — double tick trong message thread
3. **Upload file/ảnh** trong chat
4. **Student dashboard** — hiển thị lịch học, điểm, bài tập cần làm
5. **Test coverage** — viết tests cho modules chưa có (questions, schools, classes)
