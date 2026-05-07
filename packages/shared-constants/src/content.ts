/** Trạng thái nội dung (bài học, blog) */
export const CONTENT_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: 'Nháp',
  IN_REVIEW: 'Đang review',
  APPROVED: 'Đã duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Bị từ chối',
  ARCHIVED: 'Đã lưu trữ',
};

/** Màu badge theo trạng thái */
export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: '#9E9E9E',
  IN_REVIEW: '#FF9800',
  APPROVED: '#2196F3',
  PUBLISHED: '#4CAF50',
  REJECTED: '#F44336',
  ARCHIVED: '#607D8B',
};

/** Môn học */
export const SUBJECT_CODES = [
  'MATH',
  'PHYSICS',
  'CHEMISTRY',
  'BIOLOGY',
  'LITERATURE',
  'ENGLISH',
  'HISTORY',
  'GEOGRAPHY',
  'CIVIC_EDUCATION',
  'INFORMATICS',
] as const;

export type SubjectCode = (typeof SUBJECT_CODES)[number];

export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  MATH: 'Toán học',
  PHYSICS: 'Vật lý',
  CHEMISTRY: 'Hóa học',
  BIOLOGY: 'Sinh học',
  LITERATURE: 'Ngữ văn',
  ENGLISH: 'Tiếng Anh',
  HISTORY: 'Lịch sử',
  GEOGRAPHY: 'Địa lý',
  CIVIC_EDUCATION: 'Giáo dục công dân',
  INFORMATICS: 'Tin học',
};

/** Độ khó */
export const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD', 'ADVANCED'] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  ADVANCED: 'Nâng cao',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  EASY: '#4CAF50',
  MEDIUM: '#FF9800',
  HARD: '#F44336',
  ADVANCED: '#9C27B0',
};

/** Loại câu hỏi */
export const EXERCISE_TYPES = [
  'MULTIPLE_CHOICE',
  'FILL_IN_BLANK',
  'SHORT_ANSWER',
  'DRAWING',
  'ESSAY',
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  FILL_IN_BLANK: 'Điền vào chỗ trống',
  SHORT_ANSWER: 'Trả lời ngắn',
  DRAWING: 'Vẽ hình',
  ESSAY: 'Tự luận',
};
