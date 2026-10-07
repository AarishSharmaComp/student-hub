import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHubData, mutate, assignmentStatus } from "@/lib/store";
import { Assignment, Submission } from "@/types/student";
import {
  PageHeader,
  Panel,
  EmptyState,
  StatusBadge,
  ConfirmDialog,
  Pagination,
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
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { assignments, courses, submissions } = useHubData();
  const student = user?.role === "student";
  const base = student ? "/student" : "/admin";
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("");
  const [deadline, setDeadline] = useState("");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [page, setPage] = useState(1);
  const filtered = assignments.filter((a) => {
    const submission = submissions.find(
      (s) => s.assignmentId === a.id && s.studentId === user?.studentId,
    );
    const value = student
      ? assignmentStatus(a, submission)
      : submissions.some((s) => s.assignmentId === a.id && s.score === null)
        ? "Awaiting review"
        : "Published";
    return (
      (!course || a.courseId === course) &&
      (!status || value === status) &&
      a.title.toLowerCase().includes(query.toLowerCase()) &&
      (!deadline ||
        (deadline === "upcoming"
          ? Date.parse(a.dueDate) >= Date.now()
          : Date.parse(a.dueDate) < Date.now()))
    );
  });
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  return (
    <div className="page-stack">
      <PageHeader
        title="Assignments"
        description={
          student
            ? "Plan your work, submit your responses, and follow your feedback."
            : "Create focused learning activities, review submissions, and provide useful feedback."
        }
        action={
          !student && (
            <Button
              onClick={() => setCreating(true)}
              disabled={!courses.length}
            >
              <Plus className="size-4 mr-2" />
              Create assignment
            </Button>
          )
        }
      />
      <section className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search assignments"
            placeholder="Search assignments…"
          />
          <select
            className="field"
            value={course}
            aria-label="Filter assignments by course"
            onChange={(e) => {
              setCourse(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={status}
            aria-label="Filter assignments by status"
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {(student
              ? ["Not started", "Overdue", "Submitted", "Late", "Graded"]
              : ["Published", "Awaiting review"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            className="field"
            value={deadline}
            aria-label="Filter assignments by deadline"
            onChange={(e) => {
              setDeadline(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All deadlines</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past deadline</option>
          </select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>{student ? "Status" : "Submissions"}</TableHead>
              {!student && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice((safePage - 1) * 10, safePage * 10).map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Link
                    className="font-medium text-sm hover:text-primary"
                    to={`${base}/assignments/${a.id}`}
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.maxScore} points
                  </p>
                </TableCell>
                <TableCell>
                  {courses.find((c) => c.id === a.courseId)?.code}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(a.dueDate).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  {student ? (
                    <StatusBadge>
                      {assignmentStatus(
                        a,
                        submissions.find(
                          (s) =>
                            s.assignmentId === a.id &&
                            s.studentId === user?.studentId,
                        ),
                      )}
                    </StatusBadge>
                  ) : (
                    <Link
                      to={`${base}/assignments/${a.id}`}
                      className="text-xs text-primary"
                    >
                      {
                        submissions.filter((s) => s.assignmentId === a.id)
                          .length
                      }{" "}
                      submitted ·{" "}
                      {
                        submissions.filter(
                          (s) => s.assignmentId === a.id && s.score === null,
                        ).length
                      }{" "}
                      to review
                    </Link>
                  )}
                </TableCell>
                {!student && (
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${a.title}`}
                      onClick={() => setEditing(a)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${a.title}`}
                      onClick={() => setDeleting(a)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <EmptyState
            title={
              assignments.length
                ? "No matching assignments"
                : "No assignments yet"
            }
            description={
              student
                ? "New assignments will appear when your teacher publishes them."
                : "Create an assignment for one of your courses."
            }
          />
        )}
        <Pagination
          page={safePage}
          total={filtered.length}
          onChange={setPage}
        />
      </section>
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
              {editing ? "Edit assignment" : "Create assignment"}
            </DialogTitle>
            <DialogDescription>
              Deadlines use your local timezone and are stored as an absolute
              timestamp.
            </DialogDescription>
          </DialogHeader>
          <AssignmentForm
            key={editing?.id ?? "new"}
            assignment={editing ?? undefined}
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
        title="Delete assignment?"
        description="Only assignments without submissions can be deleted. Submitted work and feedback are protected."
        onConfirm={async () => {
          await mutate(`/assignments/${deleting!.id}`, "DELETE");
          toast.success("Assignment deleted");
        }}
      />
    </div>
  );
}
function localDate(value: string) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function AssignmentForm({
  assignment,
  onSaved,
}: {
  assignment?: Assignment;
  onSaved: () => void;
}) {
  const { courses } = useHubData();
  const [form, setForm] = useState({
    courseId: assignment?.courseId ?? courses[0]?.id ?? "",
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    dueDate: assignment ? localDate(assignment.dueDate) : "",
    maxScore: assignment?.maxScore ?? 100,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await mutate(
        assignment ? `/assignments/${assignment.id}` : "/assignments",
        assignment ? "PATCH" : "POST",
        { ...form, dueDate: new Date(form.dueDate).toISOString() },
      );
      toast.success(assignment ? "Assignment updated" : "Assignment published");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={pending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="assignment-course">Course</Label>
          <select
            id="assignment-course"
            className="field"
            required
            value={form.courseId}
            disabled={!!assignment}
            onChange={(e) =>
              setForm((p) => ({ ...p, courseId: e.target.value }))
            }
          >
            {courses.map((c) => (
              <option value={c.id} key={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignment-title">Title</Label>
          <Input
            id="assignment-title"
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignment-description">Instructions</Label>
          <Textarea
            id="assignment-description"
            required
            rows={5}
            maxLength={10000}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assignment-due">Deadline (local time)</Label>
            <Input
              id="assignment-due"
              type="datetime-local"
              required
              value={form.dueDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, dueDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-max">Maximum points</Label>
            <Input
              id="assignment-max"
              type="number"
              required
              min={1}
              max={10000}
              step="0.01"
              value={form.maxScore}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxScore: Number(e.target.value) }))
              }
            />
          </div>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button disabled={pending} type="submit" className="w-full">
        {pending
          ? "Saving…"
          : assignment
            ? "Save assignment"
            : "Publish assignment"}
      </Button>
    </form>
  );
}

export function AssignmentDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { assignments, courses, submissions, students, enrollments } =
    useHubData();
  const assignment = assignments.find((a) => a.id === id);
  const student = user?.role === "student";
  const base = student ? "/student" : "/admin";
  const course = courses.find((c) => c.id === assignment?.courseId);
  if (!assignment)
    return (
      <EmptyState
        title="Assignment unavailable"
        action={
          <Button asChild variant="outline">
            <Link to={base + "/assignments"}>Back to assignments</Link>
          </Button>
        }
      />
    );
  const work = submissions.filter((s) => s.assignmentId === id);
  const mine = work.find((s) => s.studentId === user?.studentId);
  const enrolled = enrollments.filter(
    (e) => e.courseId === assignment.courseId,
  ).length;
  return (
    <div className="page-stack">
      <Link
        className="text-xs text-muted-foreground flex items-center gap-2"
        to={base + "/assignments"}
      >
        <ArrowLeft className="size-3" />
        All assignments
      </Link>
      <PageHeader
        eyebrow={`${course?.code} · ${course?.name}`}
        title={assignment.title}
        description={`Due ${new Date(assignment.dueDate).toLocaleString()} · ${assignment.maxScore} points`}
        action={
          student ? (
            <StatusBadge>{assignmentStatus(assignment, mine)}</StatusBadge>
          ) : (
            <StatusBadge>
              {work.length} / {enrolled} submitted
            </StatusBadge>
          )
        }
      />
      <Panel title="Assignment instructions">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {assignment.description}
        </p>
      </Panel>
      {student ? (
        <SubmissionForm
          key={assignment.id}
          assignment={assignment}
          submission={mine}
        />
      ) : (
        <Panel
          title="Student submissions"
          description="Read the response, enter a score, and provide written feedback."
        >
          {work.length ? (
            <div className="space-y-5">
              {work.map((s) => (
                <GradeSubmission
                  key={`${s.studentId}-${s.assignmentId}`}
                  assignment={assignment}
                  submission={s}
                  name={
                    students.find((st) => st.id === s.studentId)?.name ??
                    s.studentId
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No submissions yet"
              description="Submitted student work will appear here."
            />
          )}
        </Panel>
      )}
    </div>
  );
}
function SubmissionForm({
  assignment,
  submission,
}: {
  assignment: Assignment;
  submission?: Submission;
}) {
  const [content, setContent] = useState(submission?.content ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const graded = submission?.score != null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await mutate(`/assignments/${assignment.id}/submit`, "PUT", { content });
      toast.success("Assignment submitted");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel
      title={graded ? "Your graded submission" : "Your submission"}
      description={
        submission
          ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}`
          : "Submit your response as text. Late submissions are accepted and clearly marked."
      }
    >
      {graded ? (
        <div className="space-y-5">
          <div className="p-4 bg-muted rounded-md whitespace-pre-wrap break-words text-sm">
            {submission.content}
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-semibold">
              Result: {submission.score}/{assignment.maxScore}
            </p>
            <p className="text-sm whitespace-pre-wrap mt-2 text-muted-foreground">
              {submission.feedback || "No written feedback provided."}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="submission-content">Response</Label>
              {content.trim() && !submission && (
                <StatusBadge>In progress</StatusBadge>
              )}
            </div>
            <Textarea
              id="submission-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              required
              maxLength={50000}
              disabled={pending}
              aria-describedby="submission-help"
            />
            <p id="submission-help" className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} / 50,000 characters.{" "}
              {submission
                ? "Resubmitting replaces your ungraded response."
                : "Work is submitted only when you select Submit."}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending || !content.trim()}>
            {pending
              ? "Submitting…"
              : submission
                ? "Resubmit response"
                : "Submit assignment"}
          </Button>
        </form>
      )}
    </Panel>
  );
}
function GradeSubmission({
  assignment,
  submission,
  name,
}: {
  assignment: Assignment;
  submission: Submission;
  name: string;
}) {
  const [score, setScore] = useState(
    submission.score === null ? "" : String(submission.score),
  );
  const [feedback, setFeedback] = useState(submission.feedback);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await mutate(`/assignments/${assignment.id}/grade`, "PUT", {
        studentId: submission.studentId,
        score: Number(score),
        feedback,
      });
      toast.success("Grade and feedback saved");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="border rounded-lg p-4 sm:p-5">
      <div className="flex flex-wrap gap-3 justify-between mb-4">
        <div>
          <h3 className="font-medium text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge>{assignmentStatus(assignment, submission)}</StatusBadge>
      </div>
      <details className="mb-5">
        <summary className="cursor-pointer text-xs font-medium text-primary">
          Read submitted response
        </summary>
        <p className="mt-3 bg-muted p-4 rounded-md text-sm whitespace-pre-wrap break-words max-h-80 overflow-auto">
          {submission.content}
        </p>
      </details>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-[150px_1fr] gap-4">
          <div className="space-y-2">
            <Label htmlFor={`score-${submission.studentId}`}>
              Score / {assignment.maxScore}
            </Label>
            <Input
              id={`score-${submission.studentId}`}
              type="number"
              min={0}
              max={assignment.maxScore}
              step="0.01"
              required
              disabled={pending}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`feedback-${submission.studentId}`}>Feedback</Label>
            <Textarea
              id={`feedback-${submission.studentId}`}
              disabled={pending}
              maxLength={5000}
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? "Saving…"
            : submission.score === null
              ? "Publish grade"
              : "Update grade"}
        </Button>
      </form>
    </section>
  );
}
