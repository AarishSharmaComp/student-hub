import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  randomUUID,
} from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, stored) {
  const [salt, key] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function openDatabase(
  path,
  { demo = false, adminUsername, adminPassword } = {},
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      phone TEXT NOT NULL DEFAULT '', course TEXT NOT NULL, year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 4),
      enrollmentDate TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','inactive','graduated'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')), name TEXT NOT NULL,
      studentId TEXT UNIQUE REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY, code TEXT NOT NULL COLLATE NOCASE UNIQUE, name TEXT NOT NULL,
      department TEXT NOT NULL, teacherId TEXT NOT NULL REFERENCES users(id),
      credits INTEGER NOT NULL CHECK(credits BETWEEN 1 AND 12), semester TEXT NOT NULL, description TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      courseId TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE, PRIMARY KEY(courseId,studentId)
    );
    CREATE TABLE IF NOT EXISTS attendance (
      studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE, courseId TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('present','absent','late')), PRIMARY KEY(studentId,courseId,date)
    );
    CREATE TABLE IF NOT EXISTS grades (
      studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE, courseId TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL, score REAL NOT NULL CHECK(score>=0), maxScore REAL NOT NULL CHECK(maxScore>0 AND score<=maxScore),
      grade TEXT NOT NULL, semester TEXT NOT NULL, PRIMARY KEY(studentId,courseId,subject,semester)
    );
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY, courseId TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT NOT NULL, dueDate TEXT NOT NULL, maxScore REAL NOT NULL CHECK(maxScore>0)
    );
    CREATE TABLE IF NOT EXISTS submissions (
      assignmentId TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE, content TEXT NOT NULL,
      submittedAt TEXT NOT NULL, score REAL, feedback TEXT NOT NULL DEFAULT '', PRIMARY KEY(assignmentId,studentId)
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY, courseId TEXT REFERENCES courses(id) ON DELETE CASCADE,
      authorId TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL,
      important INTEGER NOT NULL DEFAULT 0 CHECK(important IN (0,1)), createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS announcement_reads (
      announcementId TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(announcementId,userId)
    );
    CREATE INDEX IF NOT EXISTS idx_students_course ON students(course,status);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(studentId);
    CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacherId);
    CREATE INDEX IF NOT EXISTS idx_assignments_course_due ON assignments(courseId,dueDate);
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires);
    INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));`);
  if (!db.prepare("SELECT id FROM users LIMIT 1").get()) {
    if (demo) seedDemo(db);
    else if (adminUsername && adminPassword?.length >= 12) {
      db.prepare("INSERT INTO users VALUES(?,?,?,?,?,NULL)").run(
        randomUUID(),
        adminUsername,
        hashPassword(adminPassword),
        "admin",
        "Registrar",
      );
    } else
      throw new Error(
        "Set ADMIN_USERNAME and ADMIN_PASSWORD (at least 12 characters), or explicitly enable DEMO_MODE for local development.",
      );
  }
  return db;
}

function seedDemo(db) {
  const names = [
    "Aarav Sharma",
    "Priya Patel",
    "Rahul Kumar",
    "Sneha Gupta",
    "Vikram Singh",
    "Ananya Reddy",
    "Arjun Nair",
    "Meera Joshi",
    "Rohan Das",
    "Kavya Iyer",
    "Aditya Mishra",
    "Neha Verma",
    "Siddharth Rao",
    "Divya Menon",
    "Karan Malhotra",
    "Pooja Banerjee",
    "Amit Chauhan",
    "Riya Saxena",
    "Harsh Agarwal",
    "Shreya Pillai",
  ];
  const departments = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English Literature",
    "Economics",
    "Mechanical Engineering",
  ];
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,NULL)").run(
    "admin1",
    "admin",
    hashPassword("admin123"),
    "admin",
    "Academic office",
  );
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,NULL)").run(
    "teacher1",
    "teacher",
    hashPassword("teacher123"),
    "teacher",
    "Dr. Maya Chen",
  );
  const subjects = [
    "Database Systems",
    "Linear Algebra",
    "Mechanics",
    "Organic Chemistry",
    "Cell Biology",
    "Literary Theory",
    "Microeconomics",
    "Machine Design",
  ];
  departments.forEach((department, i) => {
    db.prepare("INSERT INTO courses VALUES(?,?,?,?,?,?,?,?)").run(
      `course-${i}`,
      `SH${101 + i}`,
      subjects[i],
      department,
      "teacher1",
      3,
      "Fall 2026",
      `Explore the core principles and practical applications of ${subjects[i].toLowerCase()}.`,
    );
  });
  names.forEach((name, i) => {
    const id = `student-${i + 1}`;
    const username = name.toLowerCase().replaceAll(" ", ".");
    db.prepare("INSERT INTO students VALUES(?,?,?,?,?,?,?,?)").run(
      id,
      name,
      `${username}@university.edu`,
      "",
      departments[i % 8],
      (i % 4) + 1,
      "2025-08-18",
      "active",
    );
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
      id,
      username,
      hashPassword("student123"),
      "student",
      name,
      id,
    );
    db.prepare("INSERT INTO enrollments VALUES(?,?)").run(
      `course-${i % 8}`,
      id,
    );
    for (let d = 1; d <= 20; d++) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - d);
      if ([0, 6].includes(date.getUTCDay())) continue;
      db.prepare("INSERT INTO attendance VALUES(?,?,?,?)").run(
        id,
        `course-${i % 8}`,
        date.toISOString().slice(0, 10),
        (i + d) % 7 === 0 ? "absent" : (i + d) % 9 === 0 ? "late" : "present",
      );
    }
    const score = 65 + (i % 7) * 4;
    db.prepare("INSERT INTO grades VALUES(?,?,?,?,?,?,?)").run(
      id,
      `course-${i % 8}`,
      subjects[i % 8],
      score,
      100,
      gradeLetter(score),
      "Fall 2026",
    );
  });
  const dueDate = new Date(Date.now() + 7 * 86400000).toISOString();
  db.prepare("INSERT INTO assignments VALUES(?,?,?,?,?,?)").run(
    "assignment-1",
    "course-0",
    "Relational database design",
    "Design a normalized schema for a university library. Explain your keys, relationships, and indexing choices.",
    dueDate,
    100,
  );
  db.prepare("INSERT INTO announcements VALUES(?,?,?,?,?,?,?)").run(
    "announcement-1",
    null,
    "admin1",
    "Welcome to your academic workspace",
    "Your courses, deadlines, attendance, and results are now in one place. Check this space for updates from your academic team.",
    1,
    new Date().toISOString(),
  );
}

export function gradeLetter(pct) {
  return pct >= 90
    ? "A+"
    : pct >= 80
      ? "A"
      : pct >= 70
        ? "B"
        : pct >= 60
          ? "C"
          : pct >= 50
            ? "D"
            : "F";
}
