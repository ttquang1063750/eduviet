export type UserRole =
  | 'SUPER_ADMIN'
  | 'PROVINCE_ADMIN'
  | 'DISTRICT_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'CONTENT_CREATOR'
  | 'CONTENT_REVIEWER'
  | 'CONTENT_APPROVER'
  | 'GRADER'
  | 'HOMEROOM_TEACHER'
  | 'SUBJECT_TEACHER'
  | 'STUDENT'
  | 'PARENT';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  title: string | null;
  isActive: boolean;
  isVerified: boolean;
  schoolId: string | null;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roles: UserRole[];
  title?: string;
  schoolId?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
  roles?: UserRole[];
  title?: string;
}
