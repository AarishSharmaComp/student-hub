import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./api.mjs";

let app, base, admin, teacher, student;
async function request(
  path,
  method = "GET",
  body,
  cookie,
  origin = "http://localhost:8080",
) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Student-Hub": "1",
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: res.status,
    data: await res.json(),
    cookie: res.headers.get("set-cookie")?.split(";")[0],
  };
}
before(async () => {
  app = createApp({ demo: true });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${app.server.address().port}/api`;
  admin = (
    await request("/auth/login", "POST", {
      username: "admin",
      password: "admin123",
    })
  ).cookie;
  teacher = (
    await request("/auth/login", "POST", {
      username: "teacher",
      password: "teacher123",
    })
  ).cookie;
  student = (
    await request("/auth/login", "POST", {
      username: "aarav.sharma",
      password: "student123",
    })
  ).cookie;
});
after(async () => {
  await new Promise((r) => app.server.close(r));
  app.db.close();
});
test("authentication rejects invalid credentials; responses never expose passwords", async () => {
  assert.equal(
    (
      await request("/auth/login", "POST", {
        username: "admin",
        password: "wrong",
      })
    ).status,
    401,
  );
  const me = await request("/auth/me", "GET", null, admin);
  assert.equal(me.data.role, "admin");
  assert.equal(me.data.password_hash, undefined);
  assert.equal((await request("/bootstrap")).status, 401);
  assert.equal(
    (
      await request(
        "/auth/password",
        "POST",
        { currentPassword: "wrong", newPassword: "a-new-long-password" },
        admin,
      )
    ).status,
    400,
  );
});
test("role and row authorization are enforced by API", async () => {
  assert.equal(
    (await request("/students/student-2", "GET", null, student)).status,
    403,
  );
  assert.equal(
    (await request("/students/student-2", "DELETE", {}, teacher)).status,
    403,
  );
  assert.equal((await request("/courses", "POST", {}, student)).status, 403);
  const scoped = await request("/bootstrap", "GET", null, student);
  assert.equal(scoped.data.students.length, 1);
  assert.equal(scoped.data.courses.length, 1);
  assert.equal(scoped.data.teachers.length, 0);
});
test("CSRF, malformed input, uniqueness and transactional student lifecycle", async () => {
  assert.equal(
    (await request("/auth/logout", "POST", {}, admin, "https://evil.test"))
      .status,
    403,
  );
  assert.equal((await request("/students", "POST", {}, admin)).status, 400);
  const body = {
    name: "Test Student",
    email: "test@university.edu",
    phone: "",
    course: "Computer Science",
    year: 1,
    status: "active",
    enrollmentDate: "2026-09-01",
    username: "test-student",
    password: "strong-student-password",
  };
  const created = await request("/students", "POST", body, admin);
  assert.equal(created.status, 201);
  assert.equal((await request("/students", "POST", body, admin)).status, 409);
  assert.equal(
    (
      await request(
        `/students/${created.data.id}`,
        "PATCH",
        { ...body, name: "Updated Student" },
        admin,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request(`/students/${created.data.id}`, "GET", null, admin)).data
      .name,
    "Updated Student",
  );
  const login = await request("/auth/login", "POST", {
    username: body.username,
    password: body.password,
  });
  assert.equal(login.status, 200);
  assert.equal(
    (await request(`/students/${created.data.id}`, "DELETE", {}, admin)).status,
    200,
  );
  assert.equal(
    (await request("/auth/me", "GET", null, login.cookie)).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/login", "POST", {
        username: body.username,
        password: body.password,
      })
    ).status,
    401,
  );
});
test("attendance and grades validate enrollment, dates and score bounds", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const marks = {
    courseId: "course-0",
    date: today,
    marks: [{ studentId: "student-1", status: "late" }],
  };
  assert.equal(
    (await request("/attendance", "PUT", marks, teacher)).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/attendance",
        "PUT",
        { ...marks, date: "2099-01-01" },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/attendance",
        "PUT",
        { ...marks, marks: [{ studentId: "student-2", status: "present" }] },
        teacher,
      )
    ).status,
    400,
  );
  const grade = {
    studentId: "student-1",
    grades: [
      {
        courseId: "course-0",
        subject: "Database Systems",
        score: 90,
        maxScore: 100,
        semester: "Fall 2026",
      },
    ],
  };
  assert.equal((await request("/grades", "PUT", grade, teacher)).status, 200);
  assert.equal(
    (
      await request(
        "/grades",
        "PUT",
        { ...grade, grades: [{ ...grade.grades[0], score: 101 }] },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal((await request("/grades", "PUT", grade, student)).status, 403);
});
test("assignment submission, feedback and deletion preserve academic records", async () => {
  assert.equal(
    (
      await request(
        "/assignments/assignment-1/submit",
        "PUT",
        { content: "A normalized schema with relationships." },
        student,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/assignments/assignment-1/grade",
        "PUT",
        { studentId: "student-1", score: 85, feedback: "Clear reasoning." },
        teacher,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/assignments/assignment-1/submit",
        "PUT",
        { content: "Replacement" },
        student,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request("/assignments/assignment-1", "DELETE", {}, teacher)).status,
    409,
  );
  const data = (await request("/bootstrap", "GET", null, student)).data;
  assert.equal(data.submissions[0].feedback, "Clear reasoning.");
});
test("teacher ownership cannot be bypassed and announcements are scoped", async () => {
  const t = await request(
    "/teachers",
    "POST",
    {
      name: "Other Teacher",
      username: "other-teacher",
      password: "other-teacher-password",
    },
    admin,
  );
  assert.equal(t.status, 201);
  const other = (
    await request("/auth/login", "POST", {
      username: "other-teacher",
      password: "other-teacher-password",
    })
  ).cookie;
  assert.equal(
    (
      await request(
        "/attendance",
        "PUT",
        {
          courseId: "course-0",
          date: "2026-09-01",
          marks: [{ studentId: "student-1", status: "present" }],
        },
        other,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/announcements",
        "POST",
        {
          courseId: null,
          title: "Global",
          body: "Global text",
          important: false,
        },
        teacher,
      )
    ).status,
    403,
  );
  const a = await request(
    "/announcements",
    "POST",
    {
      courseId: "course-1",
      title: "Math update",
      body: "Only for math students",
      important: false,
    },
    teacher,
  );
  assert.equal(a.status, 201);
  assert.equal(
    (await request(`/announcements/${a.data.id}/read`, "PUT", {}, student))
      .status,
    403,
  );
  assert.equal(
    (await request("/announcements/announcement-1/read", "PUT", {}, student))
      .status,
    200,
  );
});
test("legacy import is validated and rolls back the entire batch on duplicates", async () => {
  const s = {
    id: "legacy-one",
    name: "Legacy Student",
    email: "legacy@university.edu",
    phone: "",
    course: "Physics",
    year: 2,
    status: "active",
    enrollmentDate: "2024-09-01",
    attendance: [{ date: "2026-01-01", status: "present" }],
    grades: [
      { subject: "Physics", score: 40, maxScore: 50, semester: "Spring 2026" },
    ],
  };
  const imported = await request("/import", "POST", { students: [s] }, admin);
  assert.equal(imported.status, 201);
  assert.equal(imported.data.accounts.length, 1);
  assert.equal(
    (
      await request(
        "/import",
        "POST",
        {
          students: [
            { ...s, id: "legacy-two", email: "second@university.edu" },
            s,
          ],
        },
        admin,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request("/students/legacy-two", "GET", null, admin)).status,
    404,
  );
});
test("logout invalidates the server session", async () => {
  const login = await request("/auth/login", "POST", {
    username: "teacher",
    password: "teacher123",
  });
  assert.equal(
    (await request("/auth/logout", "POST", {}, login.cookie)).status,
    200,
  );
  assert.equal(
    (await request("/auth/me", "GET", null, login.cookie)).status,
    401,
  );
});
test("expired sessions are rejected", async () => {
  const short = createApp({ demo: true, sessionMs: 1 });
  await new Promise((r) => short.server.listen(0, "127.0.0.1", r));
  const target = `http://127.0.0.1:${short.server.address().port}/api`;
  try {
    const res = await fetch(target + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Student-Hub": "1" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(
      (
        await fetch(target + "/auth/me", {
          headers: { Cookie: res.headers.get("set-cookie").split(";")[0] },
        })
      ).status,
      401,
    );
  } finally {
    await new Promise((r) => short.server.close(r));
    short.db.close();
  }
});
