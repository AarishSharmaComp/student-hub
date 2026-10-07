import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useHubData,
  attendancePercent,
  averageScore,
  assignmentStatus,
} from "@/lib/store";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusBadge,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  ArrowUpRight,
  UserCheck,
  GraduationCap,
  Plus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    students,
    courses,
    enrollments,
    assignments,
    submissions,
    announcements,
  } = useHubData();
  const student = user?.role === "student";
  const admin = user?.role === "admin";
  const base = student ? "/student" : "/admin";
  const mine = students.find((s) => s.id === user?.studentId);
  const att = student
    ? mine
      ? attendancePercent(mine)
      : null
    : mean(students.map(attendancePercent));
  const average = student
    ? mine
      ? averageScore(mine)
      : null
    : mean(students.map(averageScore));
  const pending = student
    ? assignments.filter(
        (a) =>
          !submissions.some(
            (s) => s.assignmentId === a.id && s.studentId === user.studentId,
          ),
      )
    : submissions.filter((s) => s.score === null);
  const risk = students.filter((s) => (attendancePercent(s) ?? 100) < 75);
  const stats = student
    ? [
        {
          label: "Attendance",
          value: att === null ? "—" : `${att.toFixed(1)}%`,
          note: "Present sessions / recorded sessions",
          icon: UserCheck,
        },
        {
          label: "Average score",
          value: average === null ? "—" : `${average.toFixed(1)}%`,
          note: "Published course results",
          icon: GraduationCap,
        },
        {
          label: "Enrolled courses",
          value: courses.length,
          note: "Your current learning space",
          icon: BookOpen,
        },
        {
          label: "To submit",
          value: pending.length,
          note: "Assignments awaiting your work",
          icon: ClipboardCheck,
        },
      ]
    : [
        {
          label: "Students",
          value: students.length,
          note: admin
            ? "Institution-wide records"
            : "Across your teaching roster",
          icon: Users,
        },
        {
          label: "Courses",
          value: courses.length,
          note: admin ? "Active academic catalog" : "Assigned to you",
          icon: BookOpen,
        },
        {
          label: "Attendance",
          value: att === null ? "—" : `${att.toFixed(1)}%`,
          note: "Average of recorded attendance",
          icon: UserCheck,
        },
        {
          label: "Awaiting review",
          value: pending.length,
          note: "Ungraded assignment submissions",
          icon: ClipboardCheck,
        },
      ];
  const upcoming = assignments
    .filter(
      (a) =>
        Date.parse(a.dueDate) >= Date.now() &&
        (!student || !submissions.some((s) => s.assignmentId === a.id)),
    )
    .slice(0, 4);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(new Date())}
        title={`Welcome back, ${student ? (mine?.name.split(" ")[0] ?? user?.name.split(" ")[0]) : user?.name}`}
        description={
          student
            ? "Your learning, deadlines, and progress — all in one place."
            : admin
              ? "A clear view of your institution. Focus on what needs attention."
              : "Your teaching day, organized. Keep your students moving forward."
        }
        action={
          <Button asChild>
            <Link
              to={
                base +
                (student ? "/assignments" : admin ? "/add" : "/assignments")
              }
            >
              {student ? (
                <ClipboardCheck className="size-4 mr-2" />
              ) : (
                <Plus className="size-4 mr-2" />
              )}
              {student
                ? "View assignments"
                : admin
                  ? "Enroll student"
                  : "Manage assignments"}
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <section
            key={stat.label}
            className="bg-card border rounded-lg p-4 sm:p-5"
          >
            <div className="flex justify-between gap-2 items-center">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <stat.icon className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-3xl font-semibold tabular-nums tracking-tight mt-4">
              {stat.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              {stat.note}
            </p>
          </section>
        ))}
      </div>
      {((student && att !== null && att < 75) ||
        (!student && risk.length > 0)) && (
        <div className="flex flex-wrap justify-between gap-4 p-4 rounded-lg border border-warning/25 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {student
                  ? "Your attendance needs attention"
                  : `${risk.length} student${risk.length === 1 ? "" : "s"} below the 75% attendance threshold`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {student
                  ? "Review your records and contact your teacher for support."
                  : "Review attendance and follow up with your students."}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={base + (student ? "/attendance" : "/attendance-report")}>
              Review
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-5">
        <Panel
          title={
            student
              ? "Your courses"
              : admin
                ? "Course overview"
                : "Courses you teach"
          }
          description="A focused view of your academic workspace"
          action={
            <Link
              to={base + "/courses"}
              className="text-xs text-primary font-medium whitespace-nowrap"
            >
              View all
            </Link>
          }
        >
          <div className="space-y-1">
            {courses.slice(0, 4).map((c) => (
              <Link
                to={`${base}/courses/${c.id}`}
                key={c.id}
                className="flex items-center gap-4 py-4 border-b last:border-0 group"
              >
                <div className="size-10 rounded-md bg-accent text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    {c.code} · {c.semester}
                  </p>
                  <p className="font-medium text-sm group-hover:text-primary truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {student
                      ? c.teacher
                      : `${enrollments.filter((e) => e.courseId === c.id).length} students`}{" "}
                    · {c.credits} credits
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
          {!courses.length && (
            <EmptyState
              title="No courses yet"
              description={
                student
                  ? "Your academic office will enroll you in your courses."
                  : "Create a course to start organizing your teaching."
              }
            />
          )}
        </Panel>
        <Panel
          title="Upcoming deadlines"
          description="The next assignments to plan for"
          action={<ClipboardCheck className="size-4 text-muted-foreground" />}
        >
          {upcoming.length ? (
            <div className="space-y-4">
              {upcoming.map((a) => (
                <Link
                  to={`${base}/assignments/${a.id}`}
                  key={a.id}
                  className="block border-b pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    {courses.find((c) => c.id === a.courseId)?.code}
                  </p>
                  <p className="font-medium text-sm hover:text-primary">
                    {a.title}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Due{" "}
                    {new Date(a.dueDate).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming deadlines"
              description="New assignment deadlines will appear here."
            />
          )}
        </Panel>
      </div>
      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-5">
        <Panel
          title="Announcements"
          description="Updates from your academic community"
          action={
            <Link
              to={base + "/announcements"}
              className="text-xs text-primary font-medium"
            >
              View all
            </Link>
          }
        >
          {announcements.length ? (
            <div className="space-y-5">
              {announcements.slice(0, 3).map((a) => (
                <Link key={a.id} to={base + "/announcements"} className="block">
                  <div className="flex items-center gap-2 mb-2">
                    {a.important && <StatusBadge>Important</StatusBadge>}
                    <span className="text-[11px] text-muted-foreground">
                      {a.author} · {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {a.body}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="You're up to date"
              description="No announcements have been published yet."
            />
          )}
        </Panel>
        <Panel title={student ? "Recent results" : "Quick actions"}>
          {student ? (
            <>
              {mine?.grades.length ? (
                <div className="space-y-3">
                  {mine.grades.slice(0, 4).map((g) => (
                    <div
                      key={`${g.courseId}-${g.subject}-${g.semester}`}
                      className="flex justify-between items-center gap-3 text-sm py-2 border-b last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{g.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {g.semester}
                        </p>
                      </div>
                      <span className="font-semibold text-primary whitespace-nowrap">
                        {g.score}/{g.maxScore}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No results published"
                  description="Your results will appear when your teacher records them."
                />
              )}
            </>
          ) : (
            <div className="space-y-2">
              {[
                ["Record attendance", "/attendance"],
                ["Review submissions", "/assignments"],
                ["Publish an announcement", "/announcements"],
                ["Review academic reports", "/reports"],
              ].map(([title, path]) => (
                <Link
                  className="flex justify-between items-center p-3 text-sm rounded-md hover:bg-muted"
                  key={path}
                  to={base + path}
                >
                  {title}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
function mean(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v !== null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}
