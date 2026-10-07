import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useHubData,
  mutate,
  attendancePercent,
  averageScore,
} from "@/lib/store";
import { Course } from "@/types/student";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusBadge,
  ConfirmDialog,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function CoursesPage() {
  const { user } = useAuth();
  const { courses, enrollments } = useHubData();
  const student = user?.role === "student";
  const base = student ? "/student" : "/admin";
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("");
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const filtered = courses.filter(
    (c) =>
      [c.name, c.code, c.teacher, c.department].some((v) =>
        v.toLowerCase().includes(query.toLowerCase().trim()),
      ) &&
      (!semester || c.semester === semester),
  );
  return (
    <div className="page-stack">
      <PageHeader
        title={student ? "My courses" : "Courses"}
        description={
          student
            ? "Your enrolled courses, learning activities, and teaching team."
            : "Organize the catalog, manage course information, and keep academic work connected."
        }
        action={
          !student && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4 mr-2" />
              Create course
            </Button>
          )
        }
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search courses"
          placeholder="Search course name, code, teacher…"
          className="sm:max-w-md"
        />
        <select
          className="field sm:w-48"
          aria-label="Filter courses by semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">All semesters</option>
          {[...new Set(courses.map((c) => c.semester))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <section
            className="bg-card border rounded-lg flex flex-col"
            key={c.id}
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-primary rounded bg-accent px-2 py-1">
                  {c.code}
                </span>
                <BookOpen className="size-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mt-5">
                <Link
                  className="hover:text-primary"
                  to={`${base}/courses/${c.id}`}
                >
                  {c.name}
                </Link>
              </h2>
              <p className="text-xs text-muted-foreground mt-2">
                {c.department} · {c.semester}
              </p>
              <p className="text-sm text-muted-foreground mt-4 line-clamp-2 leading-relaxed">
                {c.description || "No course description provided."}
              </p>
              <div className="flex justify-between mt-5 text-xs">
                <span>{c.teacher}</span>
                <span className="text-muted-foreground">
                  {c.credits} credits
                </span>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-between items-center">
              <Link
                className="text-xs font-medium text-primary flex items-center gap-2"
                to={`${base}/courses/${c.id}`}
              >
                View course
                <ArrowUpRight className="size-3" />
              </Link>
              {!student && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-2">
                    {enrollments.filter((e) => e.courseId === c.id).length}{" "}
                    students
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => setEditing(c)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Delete ${c.name}`}
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      {!filtered.length && (
        <div className="border bg-card rounded-lg">
          <EmptyState
            title={courses.length ? "No matching courses" : "No courses yet"}
            description={
              student
                ? "Your academic office will assign your courses."
                : "Create a course, then enroll students to begin."
            }
          />
        </div>
      )}
      <Dialog
        open={creating || !!editing}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit course" : "Create course"}
            </DialogTitle>
            <DialogDescription>
              Course details are shared with enrolled students.
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            key={editing?.id ?? "new"}
            course={editing ?? undefined}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        description="Only empty courses can be deleted. Courses with enrollment, assignments, or announcements are protected."
        onConfirm={async () => {
          await mutate(`/courses/${deleting!.id}`, "DELETE");
          toast.success("Course deleted");
        }}
      />
    </div>
  );
}

function CourseForm({
  course,
  onSaved,
}: {
  course?: Course;
  onSaved: () => void;
}) {
  const { teachers } = useHubData();
  const { user } = useAuth();
  const [form, setForm] = useState({
    code: course?.code ?? "",
    name: course?.name ?? "",
    department: course?.department ?? "",
    teacherId:
      course?.teacherId ??
      (user?.role === "teacher" ? user.id : (teachers[0]?.id ?? "")),
    credits: course?.credits ?? 3,
    semester: course?.semester ?? "",
    description: course?.description ?? "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await mutate(
        course ? `/courses/${course.id}` : "/courses",
        course ? "PATCH" : "POST",
        form,
      );
      toast.success(course ? "Course updated" : "Course created");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={pending} className="grid sm:grid-cols-2 gap-4">
        {(
          [
            ["code", "Course code", 20],
            ["name", "Course name", 120],
            ["department", "Department", 120],
            ["semester", "Semester", 60],
          ] as const
        ).map(([key, label, max]) => (
          <div className="space-y-2" key={key}>
            <Label htmlFor={`course-${key}`}>{label}</Label>
            <Input
              id={`course-${key}`}
              value={form[key]}
              required
              maxLength={max}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.value }))
              }
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="course-teacher">Teacher</Label>
          <select
            id="course-teacher"
            className="field"
            value={form.teacherId}
            required
            disabled={user?.role === "teacher"}
            onChange={(e) =>
              setForm((p) => ({ ...p, teacherId: e.target.value }))
            }
          >
            {teachers.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-credits">Credits</Label>
          <Input
            id="course-credits"
            type="number"
            min={1}
            max={12}
            required
            value={form.credits}
            onChange={(e) =>
              setForm((p) => ({ ...p, credits: Number(e.target.value) }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="course-description">Description</Label>
          <Textarea
            id="course-description"
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : course ? "Save course" : "Create course"}
      </Button>
    </form>
  );
}

export function CourseDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { courses, students, enrollments, assignments } = useHubData();
  const course = courses.find((c) => c.id === id);
  const student = user?.role === "student";
  const base = student ? "/student" : "/admin";
  const [manage, setManage] = useState(false);
  if (!course)
    return (
      <EmptyState
        title="Course unavailable"
        description="This course may have been removed or is not assigned to you."
        action={
          <Button asChild variant="outline">
            <Link to={base + "/courses"}>Back to courses</Link>
          </Button>
        }
      />
    );
  const roster = students.filter((s) =>
    enrollments.some((e) => e.courseId === id && e.studentId === s.id),
  );
  const work = assignments.filter((a) => a.courseId === id);
  return (
    <div className="page-stack">
      <Link
        to={base + "/courses"}
        className="text-xs text-muted-foreground flex items-center gap-2"
      >
        <ArrowLeft className="size-3" />
        All courses
      </Link>
      <PageHeader
        eyebrow={course.code}
        title={course.name}
        description={`${course.department} · ${course.semester}`}
        action={
          user?.role === "admin" && (
            <Button variant="outline" onClick={() => setManage(true)}>
              Manage enrollment
            </Button>
          )
        }
      />
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <Panel title="About this course">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {course.description || "No description provided."}
          </p>
        </Panel>
        <Panel title="Course information">
          <dl className="text-sm space-y-3">
            {[
              ["Teacher", course.teacher],
              ["Credits", String(course.credits)],
              ["Semester", course.semester],
              ...(!student
                ? [["Enrolled students", String(roster.length)]]
                : []),
            ].map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
      <Panel
        title="Assignments"
        action={
          !student && (
            <Button variant="outline" size="sm" asChild>
              <Link to={base + "/assignments"}>Manage assignments</Link>
            </Button>
          )
        }
      >
        {work.length ? (
          <div className="divide-y">
            {work.map((a) => (
              <Link
                key={a.id}
                to={`${base}/assignments/${a.id}`}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="font-medium hover:text-primary">
                  {a.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  Due {new Date(a.dueDate).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No assignments yet" />
        )}
      </Panel>
      {!student && (
        <Panel title="Course roster">
          <div className="space-y-3">
            {roster.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b last:border-0 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.email}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">
                    Attendance:{" "}
                    {attendancePercent({
                      ...s,
                      attendance: s.attendance.filter((a) => a.courseId === id),
                    })?.toFixed(1) ?? "—"}
                    %
                  </span>
                  <StatusBadge>{s.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
          {!roster.length && (
            <EmptyState
              title="No enrolled students"
              description="The academic office can manage course enrollment."
            />
          )}
        </Panel>
      )}
      <Dialog open={manage} onOpenChange={setManage}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage enrollment · {course.code}</DialogTitle>
            <DialogDescription>
              Select enrolled students. Removal is blocked when academic records
              exist.
            </DialogDescription>
          </DialogHeader>
          <EnrollmentForm
            courseId={course.id}
            onSaved={() => setManage(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnrollmentForm({
  courseId,
  onSaved,
}: {
  courseId: string;
  onSaved: () => void;
}) {
  const { students, enrollments } = useHubData();
  const [selected, setSelected] = useState(
    new Set(
      enrollments
        .filter((e) => e.courseId === courseId)
        .map((e) => e.studentId),
    ),
  );
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setPending(true);
    setError("");
    try {
      await mutate(`/courses/${courseId}/enrollments`, "PUT", {
        studentIds: [...selected],
      });
      toast.success("Enrollment updated");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search enrollment roster"
        placeholder="Find a student…"
      />
      <p className="text-xs text-muted-foreground">{selected.size} selected</p>
      <div className="max-h-72 overflow-y-auto divide-y border rounded-md">
        {students
          .filter((s) =>
            [s.name, s.email, s.course].some((v) =>
              v.toLowerCase().includes(query.toLowerCase()),
            ),
          )
          .map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted"
            >
              <input
                type="checkbox"
                className="size-4 accent-[hsl(var(--primary))]"
                checked={selected.has(s.id)}
                disabled={pending}
                onChange={(e) =>
                  setSelected((p) => {
                    const next = new Set(p);
                    if (e.target.checked) next.add(s.id);
                    else next.delete(s.id);
                    return next;
                  })
                }
              />
              <span className="text-sm">
                {s.name}
                <span className="block text-xs text-muted-foreground">
                  {s.course} · Year {s.year}
                </span>
              </span>
            </label>
          ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save enrollment"}
      </Button>
    </div>
  );
}
