export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
/** @deprecated Dùng QuestionType thay thế */
export type ExerciseType = 'MULTIPLE_CHOICE' | 'FILL_IN_BLANK' | 'SHORT_ANSWER' | 'DRAWING' | 'ESSAY';

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'FILL_IN_BLANK'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'DRAWING';
export type SubjectCode = 'MATH' | 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY' | 'LITERATURE' | 'ENGLISH' | 'HISTORY' | 'GEOGRAPHY' | 'CIVIC_EDUCATION' | 'INFORMATICS';
