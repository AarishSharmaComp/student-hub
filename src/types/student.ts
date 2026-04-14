export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  year: number;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface GradeRecord {
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  semester: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'student';
  studentId?: string;
}
