/**
 * Trích xuất message từ Fastify API error response.
 * Shape: HttpErrorResponse { error: { error: { message: string } } }
 */
export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (error !== null && typeof error === 'object' && 'error' in error) {
    const inner = (error as { error?: { error?: { message?: string } } }).error?.error?.message;
    if (inner) return inner;
  }
  return fallback;
}
