/**
 * Tạo chữ viết tắt từ họ tên đầy đủ.
 * Lấy chữ cái đầu của mỗi từ, viết hoa, tối đa 3 ký tự.
 *
 * Ví dụ:
 *   "Nguyễn Văn A"     → "NVA"
 *   "Trần Thị Bích Nga" → "TTB"  (cắt ở 3)
 *   "Admin"             → "A"
 *   ""                  → "?"
 */
export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words
    .slice(0, 3)
    .map(w => w[0].toUpperCase())
    .join('');
}
