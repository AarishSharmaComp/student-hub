import { useSyncExternalStore } from "react";
import { HubData, Student } from "@/types/student";

const empty: HubData = {
  students: [],
  courses: [],
  enrollments: [],
  assignments: [],
  submissions: [],
  announcements: [],
  teachers: [],
};
let data: HubData = empty;
let revision = 0;
const listeners = new Set<() => void>();
const publish = (value: HubData) => {
  data = value;
  listeners.forEach((fn) => fn());
};
export const clearData = () => {
  revision++;
  publish(empty);
};
export function useHubData() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => data,
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T = { ok: boolean }>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers:
        method === "GET"
          ? {}
          : { "Content-Type": "application/json", "X-Student-Hub": "1" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to connect. Check your connection and try again.",
    );
  }
  const result = await response
    .json()
    .catch(() => ({
      message: "The service is unavailable. Please try again.",
    }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("hub-session-expired"));
    throw new ApiError(
      response.status,
      result.message || "Unable to complete the request.",
    );
  }
  return result as T;
}
export async function loadData() {
  const current = ++revision;
  const value = await api<HubData>("/bootstrap");
  if (current === revision) publish(value);
}
export async function mutate<T = { ok: boolean }>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const result = await api<T>(path, method, body);
  await loadData();
  return result;
}
// Read adapters retain the existing reporting modules while data comes from the authorized API.
export function getStudents() {
  return data.students;
}
export function getStudentById(id: string) {
  return data.students.find((s) => s.id === id);
}
export async function addStudent(
  student: Omit<Student, "id" | "attendance" | "grades"> & {
    username: string;
    password: string;
  },
) {
  return mutate<Student>("/students", "POST", student);
}
export async function updateStudent(id: string, student: Partial<Student>) {
  return mutate(`/students/${id}`, "PATCH", student);
}
export async function deleteStudent(id: string) {
  return mutate(`/students/${id}`, "DELETE");
}
export function searchStudents(query: string) {
  const q = query.trim().toLowerCase();
  return getStudents().filter((s) =>
    [s.name, s.id, s.email, s.course].some((v) => v.toLowerCase().includes(q)),
  );
}
function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export function exportStudentsCSV() {
  const rows: unknown[][] = [
    [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Department",
      "Year",
      "Status",
      "Enrollment date",
      "Attendance %",
      "Average score %",
    ],
  ];
  getStudents().forEach((s) =>
    rows.push([
      s.id,
      s.name,
      s.email,
      s.phone,
      s.course,
      s.year,
      s.status,
      s.enrollmentDate,
      attendancePercent(s)?.toFixed(1) ?? "",
      averageScore(s)?.toFixed(1) ?? "",
    ]),
  );
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function attendancePercent(s: Student) {
  return s.attendance.length
    ? (s.attendance.filter((a) => a.status === "present").length /
        s.attendance.length) *
        100
    : null;
}
export function averageScore(s: Student) {
  return s.grades.length
    ? s.grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
        s.grades.length
    : null;
}
export function downloadFile(
  content: string,
  filename: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function assignmentStatus(
  assignment: { dueDate: string },
  submission?: { score: number | null; submittedAt: string },
) {
  if (submission?.score != null) return "Graded";
  if (submission)
    return Date.parse(submission.submittedAt) > Date.parse(assignment.dueDate)
      ? "Late"
      : "Submitted";
  return Date.parse(assignment.dueDate) < Date.now()
    ? "Overdue"
    : "Not started";
}
