export interface School {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  districtId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  school?: School;
  grade: number;
  homeroomTeacherId?: string;
  homeroomTeacher?: { id: string; name: string };
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}
