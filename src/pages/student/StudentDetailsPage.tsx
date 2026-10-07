import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHubData, attendancePercent, averageScore } from "@/lib/store";
import {
  PageHeader,
  Panel,
  StatusBadge,
  EmptyState,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
export default function ProfilePage() {
  const { user } = useAuth();
  const { students, courses } = useHubData();
  const student = students.find((s) => s.id === user?.studentId);
  const base = user?.role === "student" ? "/student" : "/admin";
  const details = student
    ? [
        ["Student ID", student.id],
        ["Email", student.email],
        ["Phone", student.phone || "Not provided"],
        ["Department", student.course],
        ["Academic year", `Year ${student.year}`],
        ["Enrollment date", student.enrollmentDate],
      ]
    : [
        ["Username", user?.username],
        ["Role", user?.role === "admin" ? "Academic administrator" : "Teacher"],
        [
          "Courses taught",
          String(courses.filter((c) => c.teacherId === user?.id).length),
        ],
        ["Account ID", user?.id],
      ];
  return (
    <div className="page-stack max-w-5xl">
      <PageHeader
        title="My profile"
        description="Your account and academic information."
        action={
          <Button variant="outline" asChild>
            <Link to={base + "/settings"}>Account settings</Link>
          </Button>
        }
      />
      <Panel
        title={user?.name ?? "Profile"}
        description={student ? "Student record" : "Staff account"}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="size-16 rounded-full bg-accent flex items-center justify-center text-primary text-xl font-semibold">
            {user?.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{user?.name}</h2>
            <div className="mt-2">
              <StatusBadge>{student?.status ?? user?.role}</StatusBadge>
            </div>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground mb-2">{label}</dt>
              <dd className="font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground mt-6 border-t pt-4">
          Contact the academic office to request changes to your official
          record.
        </p>
      </Panel>
      {student && (
        <div className="grid sm:grid-cols-2 gap-5">
          <Panel title="Attendance">
            <p className="text-3xl font-semibold">
              {attendancePercent(student)?.toFixed(1) ?? "—"}
              {student.attendance.length ? "%" : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Present sessions / recorded sessions
            </p>
          </Panel>
          <Panel title="Academic performance">
            <p className="text-3xl font-semibold">
              {averageScore(student)?.toFixed(1) ?? "—"}
              {student.grades.length ? "%" : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Average normalized course score
            </p>
          </Panel>
        </div>
      )}
      <Panel title={student ? "Enrolled courses" : "Teaching assignments"}>
        {courses.length ? (
          <div className="divide-y">
            {courses
              .filter((c) => student || c.teacherId === user?.id)
              .map((c) => (
                <Link
                  key={c.id}
                  to={`${base}/courses/${c.id}`}
                  className="flex justify-between gap-4 py-3 text-sm hover:text-primary"
                >
                  <span>
                    {c.code} · {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.semester}
                  </span>
                </Link>
              ))}
          </div>
        ) : (
          <EmptyState title="No courses assigned" />
        )}
      </Panel>
    </div>
  );
}
