export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(message = 'Bạn chưa đăng nhập') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện hành động này') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string) {
    return new AppError(404, 'NOT_FOUND', `${resource} không tồn tại`);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }

  static badRequest(message: string, details?: unknown[]) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message: string, details?: unknown[]) {
    return new AppError(422, 'VALIDATION_ERROR', message, details);
  }

  static internal(message = 'Đã có lỗi xảy ra, vui lòng thử lại') {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}
