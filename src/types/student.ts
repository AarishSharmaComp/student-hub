export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  year: number;
  enrollmentDate: string;
  status: "active" | "inactive" | "graduated";
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
}

export interface AttendanceRecord {
  courseId?: string;
  date: string;
  status: "present" | "absent" | "late";
}

export interface GradeRecord {
  courseId?: string;
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  semester: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: "admin" | "teacher" | "student";
  studentId?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  teacherId: string;
  teacher: string;
  credits: number;
  semester: string;
  description: string;
}
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}
export interface Submission {
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  score: number | null;
  feedback: string;
}
export interface Announcement {
  id: string;
  courseId: string | null;
  authorId: string;
  author: string;
  title: string;
  body: string;
  important: boolean;
  createdAt: string;
  read: boolean;
}
export interface HubData {
  students: Student[];
  courses: Course[];
  enrollments: { courseId: string; studentId: string }[];
  assignments: Assignment[];
  submissions: Submission[];
  announcements: Announcement[];
  teachers: { id: string; name: string }[];
}
