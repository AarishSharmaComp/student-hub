import { Student, User } from '@/types/student';

const STUDENTS_KEY = 'sms_students';
const USERS_KEY = 'sms_users';

const COURSES = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Economics', 'Mechanical Engineering'];
const NAMES = ['Aarav Sharma', 'Priya Patel', 'Rahul Kumar', 'Sneha Gupta', 'Vikram Singh', 'Ananya Reddy', 'Arjun Nair', 'Meera Joshi', 'Rohan Das', 'Kavya Iyer', 'Aditya Mishra', 'Neha Verma', 'Siddharth Rao', 'Divya Menon', 'Karan Malhotra', 'Pooja Banerjee', 'Amit Chauhan', 'Riya Saxena', 'Harsh Agarwal', 'Shreya Pillai'];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function getGradeLetter(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function seedData() {
  const students: Student[] = NAMES.map((name, i) => {
    const course = COURSES[i % COURSES.length];
    const subjects = getSubjectsForCourse(course);
    const attendance = [];
    const now = new Date();
    for (let d = 0; d < 60; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const r = Math.random();
      attendance.push({ date: date.toISOString().split('T')[0], status: r > 0.15 ? 'present' as const : r > 0.05 ? 'late' as const : 'absent' as const });
    }
    const grades = subjects.map(sub => {
      const score = Math.floor(Math.random() * 40) + 60;
      return { subject: sub, score, maxScore: 100, grade: getGradeLetter(score), semester: 'Spring 2026' };
    });
    return {
      id: generateId(),
      name,
      email: name.toLowerCase().replace(/\s/g, '.') + '@university.edu',
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      course,
      year: Math.floor(Math.random() * 4) + 1,
      enrollmentDate: randomDate(new Date(2022, 0), new Date(2025, 0)),
      status: 'active' as const,
      attendance,
      grades,
    };
  });

  const users: User[] = [
    { id: 'admin1', username: 'admin', password: 'admin123', role: 'admin' },
    ...students.map(s => ({
      id: s.id,
      username: s.email.split('@')[0],
      password: 'student123',
      role: 'student' as const,
      studentId: s.id,
    })),
  ];

  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { students, users };
}

function getSubjectsForCourse(course: string): string[] {
  const map: Record<string, string[]> = {
    'Computer Science': ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Web Development'],
    'Mathematics': ['Calculus', 'Linear Algebra', 'Statistics', 'Number Theory', 'Discrete Math'],
    'Physics': ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics', 'Optics'],
    'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry', 'Analytical Chemistry'],
    'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Microbiology', 'Anatomy'],
    'English Literature': ['Shakespeare', 'Modern Poetry', 'Literary Theory', 'Creative Writing', 'World Literature'],
    'Economics': ['Microeconomics', 'Macroeconomics', 'Econometrics', 'Development Economics', 'Finance'],
    'Mechanical Engineering': ['Fluid Mechanics', 'Thermodynamics', 'Machine Design', 'Manufacturing', 'Control Systems'],
  };
  return map[course] || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5'];
}

export function getStudents(): Student[] {
  const data = localStorage.getItem(STUDENTS_KEY);
  if (!data) return seedData().students;
  return JSON.parse(data);
}

export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) return seedData().users;
  return JSON.parse(data);
}

export function saveStudents(students: Student[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function addStudent(student: Omit<Student, 'id' | 'attendance' | 'grades'>): Student {
  const students = getStudents();
  const newStudent: Student = { ...student, id: generateId(), attendance: [], grades: [] };
  students.push(newStudent);
  saveStudents(students);
  // Also create user account
  const users = getUsers();
  users.push({
    id: newStudent.id,
    username: newStudent.email.split('@')[0],
    password: 'student123',
    role: 'student',
    studentId: newStudent.id,
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newStudent;
}

export function updateStudent(id: string, data: Partial<Student>): Student | null {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return null;
  students[idx] = { ...students[idx], ...data };
  saveStudents(students);
  return students[idx];
}

export function deleteStudent(id: string): boolean {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  if (filtered.length === students.length) return false;
  saveStudents(filtered);
  return true;
}

export function getStudentById(id: string): Student | undefined {
  return getStudents().find(s => s.id === id);
}

export function searchStudents(query: string): Student[] {
  const q = query.toLowerCase();
  return getStudents().filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.id.includes(q) ||
    s.email.toLowerCase().includes(q) ||
    s.course.toLowerCase().includes(q)
  );
}

export function exportStudentsCSV(): string {
  const students = getStudents();
  const headers = 'ID,Name,Email,Phone,Course,Year,Status,Enrollment Date,Attendance %,GPA\n';
  const rows = students.map(s => {
    const attPct = s.attendance.length ? ((s.attendance.filter(a => a.status === 'present').length / s.attendance.length) * 100).toFixed(1) : '0';
    const gpa = s.grades.length ? (s.grades.reduce((sum, g) => sum + g.score, 0) / s.grades.length).toFixed(1) : '0';
    return `${s.id},"${s.name}",${s.email},${s.phone},"${s.course}",${s.year},${s.status},${s.enrollmentDate},${attPct},${gpa}`;
  }).join('\n');
  return headers + rows;
}

export function authenticate(username: string, password: string): User | null {
  const users = getUsers();
  return users.find(u => u.username === username && u.password === password) || null;
}
