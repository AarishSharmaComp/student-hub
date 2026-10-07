import { createServer } from "node:http";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import { z } from "zod";
import {
  openDatabase,
  hashPassword,
  verifyPassword,
  gradeLetter,
} from "./database.mjs";

const text = (max) => z.string().trim().min(1).max(max);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Invalid date",
  );
const studentSchema = z.object({
  name: text(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(40),
  course: text(120),
  year: z.number().int().min(1).max(4),
  enrollmentDate: date,
  status: z.enum(["active", "inactive", "graduated"]),
});
const attendanceSchema = z.object({
  courseId: z.string().default(""),
  date,
  status: z.enum(["present", "absent", "late"]),
});
const gradeSchema = z
  .object({
    courseId: z.string().default(""),
    subject: text(120),
    score: z.number().min(0),
    maxScore: z.number().positive().max(10000),
    semester: text(60),
  })
  .refine((v) => v.score <= v.maxScore, "Score exceeds maximum");
const courseSchema = z.object({
  code: text(20),
  name: text(120),
  department: text(120),
  teacherId: text(80),
  credits: z.number().int().min(1).max(12),
  semester: text(60),
  description: z.string().trim().max(5000),
});
const assignmentSchema = z.object({
  courseId: text(80),
  title: text(160),
  description: text(10000),
  dueDate: z.string().datetime({ offset: true }),
  maxScore: z.number().positive().max(10000),
});
const announcementSchema = z.object({
  courseId: z.string().nullable(),
  title: text(160),
  body: text(10000),
  important: z.boolean(),
});
const safeUser = (u) => ({
  id: u.id,
  username: u.username,
  role: u.role,
  name: u.name,
  studentId: u.studentId ?? undefined,
});
const tokenHash = (t) => createHash("sha256").update(t).digest("hex");
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};

export function createApp({
  databasePath = ":memory:",
  demo = false,
  origin = "http://localhost:8080",
  production = false,
  adminUsername,
  adminPassword,
  sessionMs = 8 * 3600000,
} = {}) {
  const db = openDatabase(databasePath, { demo, adminUsername, adminPassword });
  const allowedOrigins = new Set([
    origin,
    ...(!production
      ? ["http://localhost:8080", "http://127.0.0.1:8080"]
      : []),
  ]);
  const attempts = new Map();
  const dummyHash = hashPassword(randomBytes(32).toString("hex"));
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  const requireStaff = (u) => {
    if (u.role === "student") fail(403, "Staff access required.");
  };
  const requireAdmin = (u) => {
    if (u.role !== "admin") fail(403, "Administrator access required.");
  };
  const courseAccess = (u, id) => {
    const c = get("SELECT * FROM courses WHERE id=?", id);
    if (!c) fail(404, "Course not found.");
    if (u.role === "teacher" && c.teacherId !== u.id)
      fail(403, "This course is not assigned to you.");
    if (
      u.role === "student" &&
      !get(
        "SELECT 1 FROM enrollments WHERE courseId=? AND studentId=?",
        id,
        u.studentId,
      )
    )
      fail(403, "You are not enrolled in this course.");
    return c;
  };
  const studentAccess = (u, id) => {
    const s = get("SELECT * FROM students WHERE id=?", id);
    if (!s) fail(404, "Student not found.");
    if (u.role === "student" && id !== u.studentId)
      fail(403, "You can only access your own record.");
    if (
      u.role === "teacher" &&
      !get(
        "SELECT 1 FROM enrollments e JOIN courses c ON c.id=e.courseId WHERE e.studentId=? AND c.teacherId=?",
        id,
        u.id,
      )
    )
      fail(403, "This student is not in your courses.");
    return s;
  };
  const ownedCourseIds = (u) =>
    all("SELECT id FROM courses WHERE teacherId=?", u.id).map((c) => c.id);
  const studentRecord = (s, u) => {
    let attendance = all(
      "SELECT courseId,date,status FROM attendance WHERE studentId=? ORDER BY date DESC",
      s.id,
    );
    let grades = all(
      "SELECT courseId,subject,score,maxScore,grade,semester FROM grades WHERE studentId=?",
      s.id,
    );
    if (u.role === "teacher") {
      const ids = ownedCourseIds(u);
      attendance = attendance.filter((a) => ids.includes(a.courseId));
      grades = grades.filter((g) => ids.includes(g.courseId));
    }
    return { ...s, attendance, grades };
  };
  const bootstrap = (u) => {
    const courses = all(
      `SELECT c.*,u.name AS teacher FROM courses c JOIN users u ON u.id=c.teacherId ${u.role === "teacher" ? "WHERE c.teacherId=?" : u.role === "student" ? "WHERE c.id IN (SELECT courseId FROM enrollments WHERE studentId=?)" : ""} ORDER BY c.code`,
      ...(u.role === "admin"
        ? []
        : [u.role === "teacher" ? u.id : u.studentId]),
    );
    const ids = new Set(courses.map((c) => c.id));
    const students = all(
      `SELECT * FROM students ${u.role === "student" ? "WHERE id=?" : u.role === "teacher" ? "WHERE id IN (SELECT e.studentId FROM enrollments e JOIN courses c ON c.id=e.courseId WHERE c.teacherId=?)" : ""} ORDER BY name`,
      ...(u.role === "admin"
        ? []
        : [u.role === "teacher" ? u.id : u.studentId]),
    ).map((s) => studentRecord(s, u));
    const enrollments = all("SELECT * FROM enrollments").filter(
      (e) =>
        ids.has(e.courseId) &&
        (u.role !== "student" || e.studentId === u.studentId),
    );
    const assignments = all(
      "SELECT * FROM assignments ORDER BY dueDate",
    ).filter((a) => ids.has(a.courseId));
    const assignmentIds = new Set(assignments.map((a) => a.id));
    const submissions = all("SELECT * FROM submissions").filter(
      (s) =>
        assignmentIds.has(s.assignmentId) &&
        (u.role !== "student" || s.studentId === u.studentId),
    );
    const announcements = all(
      "SELECT a.*,u.name AS author FROM announcements a JOIN users u ON u.id=a.authorId ORDER BY a.createdAt DESC",
    )
      .filter((a) => !a.courseId || ids.has(a.courseId))
      .map((a) => ({
        ...a,
        important: !!a.important,
        read: !!get(
          "SELECT 1 FROM announcement_reads WHERE announcementId=? AND userId=?",
          a.id,
          u.id,
        ),
      }));
    const teachers =
      u.role === "admin"
        ? all("SELECT id,name FROM users WHERE role IN ('teacher','admin')")
        : u.role === "teacher"
          ? [{ id: u.id, name: u.name }]
          : [];
    return {
      students,
      courses,
      enrollments,
      assignments,
      submissions,
      announcements,
      teachers,
    };
  };
  const insertStudent = (data, id = randomUUID()) => {
    run(
      "INSERT INTO students VALUES(?,?,?,?,?,?,?,?)",
      id,
      data.name,
      data.email,
      data.phone,
      data.course,
      data.year,
      data.enrollmentDate,
      data.status,
    );
    return id;
  };
  const writeAttendance = (id, records) => {
    records.forEach((a) =>
      run(
        "INSERT INTO attendance VALUES(?,?,?,?) ON CONFLICT(studentId,courseId,date) DO UPDATE SET status=excluded.status",
        id,
        a.courseId,
        a.date,
        a.status,
      ),
    );
  };
  const writeGrades = (id, records) => {
    records.forEach((g) =>
      run(
        "INSERT INTO grades VALUES(?,?,?,?,?,?,?) ON CONFLICT(studentId,courseId,subject,semester) DO UPDATE SET score=excluded.score,maxScore=excluded.maxScore,grade=excluded.grade",
        id,
        g.courseId,
        g.subject,
        g.score,
        g.maxScore,
        gradeLetter((g.score / g.maxScore) * 100),
        g.semester,
      ),
    );
  };

  const server = createServer(async (req, res) => {
    const json = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      if (!path.startsWith("/api/")) {
        if (!production || req.method !== "GET") fail(404, "Not found.");
        const root = resolve("dist");
        const file = resolve(root, `.${decodeURIComponent(path)}`);
        if (!file.startsWith(root + "/") && file !== root)
          fail(404, "Not found.");
        const target =
          existsSync(file) && statSync(file).isFile()
            ? file
            : resolve(root, "index.html");
        const types = {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".ico": "image/x-icon",
        };
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
        );
        res.writeHead(200, {
          "Content-Type": types[extname(target)] || "application/octet-stream",
          "Cache-Control": target.includes("/assets/")
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        });
        res.end(readFileSync(target));
        return;
      }
      if (path === "/api/config" && req.method === "GET") {
        json(200, { demo });
        return;
      }
      const mutation = !["GET", "HEAD"].includes(req.method);
      if (mutation) {
        if (req.headers.origin && !allowedOrigins.has(req.headers.origin))
          fail(403, "Request origin is not allowed.");
        if (
          req.headers["x-student-hub"] !== "1" ||
          !req.headers["content-type"]?.startsWith("application/json")
        )
          fail(403, "A same-origin JSON request is required.");
      }
      let body = {};
      if (mutation) {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 1024 * 1024)
            fail(413, "Request is too large.");
        }
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          fail(400, "Invalid JSON.");
        }
      }
      if (path === "/api/auth/login" && req.method === "POST") {
        const { username, password } = z
          .object({ username: text(254), password: z.string().min(1).max(256) })
          .parse(body);
        const key = req.socket.remoteAddress;
        const attempt = attempts.get(key);
        if (attempt && attempt.until > Date.now() && attempt.count >= 10)
          fail(429, "Too many attempts. Please try again in 15 minutes.");
        const u = get(
          "SELECT * FROM users WHERE username=? COLLATE NOCASE",
          username,
        );
        const valid = verifyPassword(password, u?.password_hash || dummyHash);
        if (!u || !valid) {
          if (attempts.size > 10000) attempts.clear();
          attempts.set(key, {
            count: attempt?.until > Date.now() ? attempt.count + 1 : 1,
            until: Date.now() + 15 * 60000,
          });
          fail(401, "Invalid username or password.");
        }
        if (
          u.studentId &&
          get("SELECT status FROM students WHERE id=?", u.studentId)?.status ===
            "inactive"
        )
          fail(403, "Your account is inactive. Contact the academic office.");
        attempts.delete(key);
        run("DELETE FROM sessions WHERE expires<?", Date.now());
        const token = randomBytes(32).toString("hex");
        run(
          "INSERT INTO sessions VALUES(?,?,?)",
          tokenHash(token),
          u.id,
          Date.now() + sessionMs,
        );
        res.setHeader(
          "Set-Cookie",
          `hub_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionMs / 1000)}${production ? "; Secure" : ""}`,
        );
        json(200, safeUser(u));
        return;
      }
      const token = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("hub_session="))
        ?.slice(12);
      const u = token
        ? get(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
            tokenHash(token),
            Date.now(),
          )
        : null;
      if (!u) fail(401, "Your session has expired. Please sign in.");
      if (
        u.studentId &&
        get("SELECT status FROM students WHERE id=?", u.studentId)?.status ===
          "inactive"
      )
        fail(401, "Your account is inactive.");
      if (path === "/api/auth/me" && req.method === "GET") {
        json(200, safeUser(u));
        return;
      }
      if (path === "/api/auth/logout" && req.method === "POST") {
        run("DELETE FROM sessions WHERE token=?", tokenHash(token));
        res.setHeader(
          "Set-Cookie",
          `hub_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production ? "; Secure" : ""}`,
        );
        json(200, { ok: true });
        return;
      }
      if (path === "/api/auth/password" && req.method === "POST") {
        const data = z
          .object({
            currentPassword: z.string().max(256),
            newPassword: z.string().min(12).max(256),
          })
          .parse(body);
        if (!verifyPassword(data.currentPassword, u.password_hash))
          fail(400, "Current password is incorrect.");
        transaction(() => {
          run(
            "UPDATE users SET password_hash=? WHERE id=?",
            hashPassword(data.newPassword),
            u.id,
          );
          run(
            "DELETE FROM sessions WHERE user_id=? AND token<>?",
            u.id,
            tokenHash(token),
          );
        });
        json(200, { ok: true });
        return;
      }
      if (path === "/api/bootstrap" && req.method === "GET") {
        json(200, bootstrap(u));
        return;
      }
      if (path === "/api/students" && req.method === "POST") {
        requireAdmin(u);
        const s = studentSchema.parse(body);
        const account = z
          .object({
            username: text(254),
            password: z.string().min(12).max(256),
          })
          .parse(body);
        const id = transaction(() => {
          const id = insertStudent(s);
          run(
            "INSERT INTO users VALUES(?,?,?,?,?,?)",
            id,
            account.username,
            hashPassword(account.password),
            "student",
            s.name,
            id,
          );
          return id;
        });
        json(
          201,
          studentRecord(get("SELECT * FROM students WHERE id=?", id), u),
        );
        return;
      }
      const studentMatch = path.match(/^\/api\/students\/([^/]+)$/);
      if (studentMatch) {
        const id = studentMatch[1];
        studentAccess(u, id);
        if (req.method === "GET") {
          json(
            200,
            studentRecord(get("SELECT * FROM students WHERE id=?", id), u),
          );
          return;
        }
        requireAdmin(u);
        if (req.method === "DELETE") {
          run("DELETE FROM students WHERE id=?", id);
          json(200, { ok: true });
          return;
        }
        if (req.method === "PATCH") {
          const data = studentSchema.parse(body);
          transaction(() => {
            run(
              "UPDATE students SET name=?,email=?,phone=?,course=?,year=?,enrollmentDate=?,status=? WHERE id=?",
              data.name,
              data.email,
              data.phone,
              data.course,
              data.year,
              data.enrollmentDate,
              data.status,
              id,
            );
            run("UPDATE users SET name=? WHERE studentId=?", data.name, id);
          });
          json(200, { ok: true });
          return;
        }
      }
      if (path === "/api/attendance" && req.method === "PUT") {
        requireStaff(u);
        const data = z
          .object({
            courseId: text(80),
            date,
            marks: z
              .array(
                z.object({
                  studentId: text(80),
                  status: z.enum(["present", "absent", "late"]),
                }),
              )
              .min(1)
              .max(500),
          })
          .parse(body);
        courseAccess(u, data.courseId);
        if (data.date > new Date().toISOString().slice(0, 10))
          fail(400, "Attendance cannot be recorded in the future.");
        transaction(() =>
          data.marks.forEach((m) => {
            if (
              !get(
                "SELECT 1 FROM enrollments WHERE courseId=? AND studentId=?",
                data.courseId,
                m.studentId,
              )
            )
              fail(400, "Student is not enrolled.");
            writeAttendance(m.studentId, [
              { courseId: data.courseId, date: data.date, status: m.status },
            ]);
          }),
        );
        json(200, { ok: true });
        return;
      }
      if (path === "/api/grades" && req.method === "PUT") {
        requireStaff(u);
        const data = z
          .object({
            studentId: text(80),
            grades: z.array(gradeSchema).min(1).max(100),
          })
          .parse(body);
        studentAccess(u, data.studentId);
        transaction(() =>
          data.grades.forEach((g) => {
            courseAccess(u, g.courseId);
            if (
              !get(
                "SELECT 1 FROM enrollments WHERE courseId=? AND studentId=?",
                g.courseId,
                data.studentId,
              )
            )
              fail(400, "Student is not enrolled.");
            writeGrades(data.studentId, [g]);
          }),
        );
        json(200, { ok: true });
        return;
      }
      if (path === "/api/courses" && req.method === "POST") {
        requireStaff(u);
        const c = courseSchema.parse(body);
        if (u.role === "teacher" && c.teacherId !== u.id)
          fail(403, "You can only create courses assigned to yourself.");
        if (
          !get(
            "SELECT 1 FROM users WHERE id=? AND role IN ('teacher','admin')",
            c.teacherId,
          )
        )
          fail(400, "Select a valid teacher.");
        const id = randomUUID();
        run(
          "INSERT INTO courses VALUES(?,?,?,?,?,?,?,?)",
          id,
          c.code.toUpperCase(),
          c.name,
          c.department,
          c.teacherId,
          c.credits,
          c.semester,
          c.description,
        );
        json(201, { id });
        return;
      }
      const courseMatch = path.match(
        /^\/api\/courses\/([^/]+)(\/enrollments)?$/,
      );
      if (courseMatch) {
        requireStaff(u);
        const id = courseMatch[1];
        courseAccess(u, id);
        if (courseMatch[2] && req.method === "PUT") {
          const { studentIds } = z
            .object({ studentIds: z.array(text(80)).max(1000) })
            .parse(body);
          // Enrollment changes are registrar-owned, preventing teachers from claiming other students.
          requireAdmin(u);
          const unique = [...new Set(studentIds)];
          const removed = all(
            "SELECT studentId FROM enrollments WHERE courseId=?",
            id,
          ).filter((e) => !unique.includes(e.studentId));
          if (
            removed.some(
              (e) =>
                get(
                  "SELECT 1 FROM submissions s JOIN assignments a ON a.id=s.assignmentId WHERE a.courseId=? AND s.studentId=?",
                  id,
                  e.studentId,
                ) ||
                get(
                  "SELECT 1 FROM attendance WHERE courseId=? AND studentId=?",
                  id,
                  e.studentId,
                ) ||
                get(
                  "SELECT 1 FROM grades WHERE courseId=? AND studentId=?",
                  id,
                  e.studentId,
                ),
            )
          )
            fail(409, "Enrollment with academic records cannot be removed.");
          transaction(() => {
            run("DELETE FROM enrollments WHERE courseId=?", id);
            unique.forEach((s) => {
              if (!get("SELECT 1 FROM students WHERE id=?", s))
                fail(400, "Student not found.");
              run("INSERT INTO enrollments VALUES(?,?)", id, s);
            });
          });
          json(200, { ok: true });
          return;
        }
        if (!courseMatch[2] && req.method === "PATCH") {
          const c = courseSchema.parse(body);
          if (u.role === "teacher" && c.teacherId !== u.id)
            fail(403, "Only an administrator can reassign a teacher.");
          if (
            !get(
              "SELECT 1 FROM users WHERE id=? AND role IN ('teacher','admin')",
              c.teacherId,
            )
          )
            fail(400, "Select a valid teacher.");
          run(
            "UPDATE courses SET code=?,name=?,department=?,teacherId=?,credits=?,semester=?,description=? WHERE id=?",
            c.code.toUpperCase(),
            c.name,
            c.department,
            c.teacherId,
            c.credits,
            c.semester,
            c.description,
            id,
          );
          json(200, { ok: true });
          return;
        }
        if (!courseMatch[2] && req.method === "DELETE") {
          if (
            get("SELECT 1 FROM enrollments WHERE courseId=?", id) ||
            get("SELECT 1 FROM assignments WHERE courseId=?", id) ||
            get("SELECT 1 FROM announcements WHERE courseId=?", id)
          )
            fail(
              409,
              "Only empty courses can be deleted. Existing academic records are preserved.",
            );
          run("DELETE FROM courses WHERE id=?", id);
          json(200, { ok: true });
          return;
        }
      }
      if (path === "/api/assignments" && req.method === "POST") {
        requireStaff(u);
        const a = assignmentSchema.parse(body);
        courseAccess(u, a.courseId);
        const id = randomUUID();
        run(
          "INSERT INTO assignments VALUES(?,?,?,?,?,?)",
          id,
          a.courseId,
          a.title,
          a.description,
          a.dueDate,
          a.maxScore,
        );
        json(201, { id });
        return;
      }
      const assignmentMatch = path.match(
        /^\/api\/assignments\/([^/]+)(\/submit|\/grade)?$/,
      );
      if (assignmentMatch) {
        const id = assignmentMatch[1];
        const a = get("SELECT * FROM assignments WHERE id=?", id);
        if (!a) fail(404, "Assignment not found.");
        courseAccess(u, a.courseId);
        if (assignmentMatch[2] === "/submit" && req.method === "PUT") {
          if (u.role !== "student") fail(403, "Student access required.");
          if (
            get(
              "SELECT score FROM submissions WHERE assignmentId=? AND studentId=?",
              id,
              u.studentId,
            )?.score != null
          )
            fail(409, "A graded submission cannot be replaced.");
          const { content } = z.object({ content: text(50000) }).parse(body);
          run(
            "INSERT INTO submissions VALUES(?,?,?,?,NULL,'') ON CONFLICT(assignmentId,studentId) DO UPDATE SET content=excluded.content,submittedAt=excluded.submittedAt",
            id,
            u.studentId,
            content,
            new Date().toISOString(),
          );
          json(200, { ok: true });
          return;
        }
        requireStaff(u);
        if (assignmentMatch[2] === "/grade" && req.method === "PUT") {
          const s = z
            .object({
              studentId: text(80),
              score: z.number().min(0).max(a.maxScore),
              feedback: z.string().trim().max(5000),
            })
            .parse(body);
          if (
            !get(
              "SELECT 1 FROM submissions WHERE assignmentId=? AND studentId=?",
              id,
              s.studentId,
            )
          )
            fail(404, "Submission not found.");
          run(
            "UPDATE submissions SET score=?,feedback=? WHERE assignmentId=? AND studentId=?",
            s.score,
            s.feedback,
            id,
            s.studentId,
          );
          json(200, { ok: true });
          return;
        }
        if (!assignmentMatch[2] && req.method === "PATCH") {
          const data = assignmentSchema.parse(body);
          if (data.courseId !== a.courseId)
            fail(400, "Assignments cannot be moved between courses.");
          if (
            get(
              "SELECT 1 FROM submissions WHERE assignmentId=? AND score>?",
              id,
              data.maxScore,
            )
          )
            fail(409, "Maximum score is below an existing grade.");
          run(
            "UPDATE assignments SET title=?,description=?,dueDate=?,maxScore=? WHERE id=?",
            data.title,
            data.description,
            data.dueDate,
            data.maxScore,
            id,
          );
          json(200, { ok: true });
          return;
        }
        if (!assignmentMatch[2] && req.method === "DELETE") {
          if (get("SELECT 1 FROM submissions WHERE assignmentId=?", id))
            fail(409, "Assignments with submissions cannot be deleted.");
          run("DELETE FROM assignments WHERE id=?", id);
          json(200, { ok: true });
          return;
        }
      }
      if (path === "/api/announcements" && req.method === "POST") {
        requireStaff(u);
        const a = announcementSchema.parse(body);
        if (a.courseId) courseAccess(u, a.courseId);
        else requireAdmin(u);
        const id = randomUUID();
        run(
          "INSERT INTO announcements VALUES(?,?,?,?,?,?,?)",
          id,
          a.courseId,
          u.id,
          a.title,
          a.body,
          +a.important,
          new Date().toISOString(),
        );
        json(201, { id });
        return;
      }
      const announcementMatch = path.match(
        /^\/api\/announcements\/([^/]+)(\/read)?$/,
      );
      if (announcementMatch) {
        const id = announcementMatch[1];
        const a = get("SELECT * FROM announcements WHERE id=?", id);
        if (!a) fail(404, "Announcement not found.");
        if (a.courseId) courseAccess(u, a.courseId);
        if (announcementMatch[2] && req.method === "PUT") {
          run("INSERT OR IGNORE INTO announcement_reads VALUES(?,?)", id, u.id);
          json(200, { ok: true });
          return;
        }
        requireStaff(u);
        if (u.role !== "admin" && a.authorId !== u.id)
          fail(403, "You can only edit your own announcements.");
        if (!announcementMatch[2] && req.method === "PATCH") {
          const data = announcementSchema.parse(body);
          if (data.courseId) courseAccess(u, data.courseId);
          else requireAdmin(u);
          run(
            "UPDATE announcements SET courseId=?,title=?,body=?,important=? WHERE id=?",
            data.courseId,
            data.title,
            data.body,
            +data.important,
            id,
          );
          json(200, { ok: true });
          return;
        }
        if (!announcementMatch[2] && req.method === "DELETE") {
          run("DELETE FROM announcements WHERE id=?", id);
          json(200, { ok: true });
          return;
        }
      }
      if (path === "/api/teachers" && req.method === "POST") {
        requireAdmin(u);
        const t = z
          .object({
            name: text(120),
            username: text(254),
            password: z.string().min(12).max(256),
          })
          .parse(body);
        const id = randomUUID();
        run(
          "INSERT INTO users VALUES(?,?,?,?,?,NULL)",
          id,
          t.username,
          hashPassword(t.password),
          "teacher",
          t.name,
        );
        json(201, { id });
        return;
      }
      if (path === "/api/import" && req.method === "POST") {
        requireAdmin(u);
        const { students } = z
          .object({
            students: z
              .array(
                studentSchema.extend({
                  id: text(80),
                  attendance: z.array(attendanceSchema).max(10000),
                  grades: z.array(gradeSchema).max(500),
                }),
              )
              .min(1)
              .max(500),
          })
          .parse(body);
        const passwords = [];
        transaction(() =>
          students.forEach((s) => {
            if (
              get("SELECT 1 FROM students WHERE id=? OR email=?", s.id, s.email)
            )
              fail(
                409,
                `Student ${s.email} already exists. Import stopped without changes.`,
              );
            insertStudent(s, s.id);
            const password = randomBytes(18).toString("base64url");
            run(
              "INSERT INTO users VALUES(?,?,?,?,?,?)",
              s.id,
              s.email,
              hashPassword(password),
              "student",
              s.name,
              s.id,
            );
            // Historical local records have no relational course IDs; retain them as legacy records.
            writeAttendance(
              s.id,
              s.attendance.map((a) => ({ ...a, courseId: "" })),
            );
            writeGrades(
              s.id,
              s.grades.map((g) => ({ ...g, courseId: "" })),
            );
            passwords.push({ username: s.email, password });
          }),
        );
        json(201, { accounts: passwords });
        return;
      }
      fail(404, "Endpoint not found.");
    } catch (e) {
      if (e instanceof z.ZodError) {
        json(400, {
          message: e.issues
            .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
            .join("; "),
        });
        return;
      }
      if (
        e.code?.startsWith("ERR_SQLITE") &&
        /UNIQUE constraint/.test(e.message)
      ) {
        json(409, {
          message:
            "This email, username, course code, or record already exists.",
        });
        return;
      }
      if (e.status) {
        json(e.status, { message: e.message });
        return;
      }
      console.error("[api]", req.method, req.url, e.message);
      json(500, {
        message: "Unable to complete the request. Please try again.",
      });
    }
  });
  return { server, db };
}
