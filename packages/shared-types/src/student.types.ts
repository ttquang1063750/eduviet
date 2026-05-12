import type { Difficulty, SubjectCode } from './common.types';

// Bài học hiển thị trong student dashboard
export interface StudentLesson {
  id: string;
  title: string;
  slug: string;
  subject: {
    id: string;
    code: SubjectCode;
    name: string;
    color: string | null;
  };
  grade: number;
  topic: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  totalQuestions: number;
}

// Lớp học mà học sinh đang theo học
export interface StudentClass {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  school: {
    id: string;
    name: string;
  };
  homeroomTeacher: {
    id: string;
    fullName: string;
  } | null;
  lessons: StudentLesson[];
}

// Thống kê tiến độ học tập
export interface StudentProgress {
  totalLessons: number;       // tổng số bài học trong các lớp đang học
  completedLessons: number;   // số bài đã làm (ít nhất 1 câu trả lời)
  totalClasses: number;       // số lớp đang theo học
}

// Response của GET /api/students/me/dashboard
export interface StudentDashboard {
  classes: StudentClass[];
  progress: StudentProgress;
}
