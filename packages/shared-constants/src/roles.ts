export const USER_ROLES = [
  'SUPER_ADMIN',
  'PROVINCE_ADMIN',
  'DISTRICT_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'CONTENT_REVIEWER',
  'CONTENT_APPROVER',
  'GRADER',
  'HOMEROOM_TEACHER',
  'SUBJECT_TEACHER',
  'STUDENT',
  'PARENT',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Roles có quyền quản trị (xem tất cả nội dung, quản lý users) */
export const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'PROVINCE_ADMIN',
  'DISTRICT_ADMIN',
  'SCHOOL_ADMIN',
];

/** Roles liên quan đến nội dung bài học */
export const CONTENT_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'CONTENT_REVIEWER',
  'CONTENT_APPROVER',
  'SUBJECT_TEACHER',
  'HOMEROOM_TEACHER',
];

/** Roles có thể tạo/chỉnh sửa bài học */
export const CREATOR_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'SUBJECT_TEACHER',
  'HOMEROOM_TEACHER',
];

/** Roles giáo viên */
export const TEACHER_ROLES: UserRole[] = ['HOMEROOM_TEACHER', 'SUBJECT_TEACHER'];

/** Label tiếng Việt của từng role */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Quản trị toàn quốc',
  PROVINCE_ADMIN: 'Quản trị cấp tỉnh',
  DISTRICT_ADMIN: 'Quản trị cấp huyện',
  SCHOOL_ADMIN: 'Quản trị trường',
  CONTENT_CREATOR: 'Người tạo nội dung',
  CONTENT_REVIEWER: 'Người review nội dung',
  CONTENT_APPROVER: 'Người duyệt nội dung',
  GRADER: 'Người chấm điểm',
  HOMEROOM_TEACHER: 'Giáo viên chủ nhiệm',
  SUBJECT_TEACHER: 'Giáo viên bộ môn',
  STUDENT: 'Học sinh',
  PARENT: 'Phụ huynh',
};
