import { useState } from "react";
import { useHubData, mutate } from "@/lib/store";
import { PageHeader, Panel, EmptyState } from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
export default function GradesPage() {
  const { students, courses, enrollments } = useHubData();
  const [courseId, setCourse] = useState(courses[0]?.id ?? "");
  const [studentId, setStudent] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [pending, setPending] = useState(false);
  const course = courses.find((c) => c.id === courseId);
  const roster = students.filter((s) =>
    enrollments.some((e) => e.studentId === s.id && e.courseId === courseId),
  );
  const student = roster.find((s) => s.id === studentId);
  const choose = (id: string) => {
    setStudent(id);
    const grade = students
      .find((s) => s.id === id)
      ?.grades.find(
        (g) => g.courseId === courseId && g.semester === course?.semester,
      );
    setScore(grade ? String(grade.score) : "");
    setMaxScore(grade ? String(grade.maxScore) : "100");
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !student) return;
    setPending(true);
    try {
      await mutate("/grades", "PUT", {
        studentId,
        grades: [
          {
            courseId,
            subject: course.name,
            score: Number(score),
            maxScore: Number(maxScore),
            semester: course.semester,
          },
        ],
      });
      toast.success(`Grade saved for ${student.name}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="page-stack">
      <PageHeader
        title="Academic grades"
        description="Enter or update a course result. Scores are validated against the maximum and letter grades are calculated consistently."
      />
      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
        <div className="space-y-2">
          <Label htmlFor="grade-course">Course</Label>
          <select
            id="grade-course"
            className="field"
            value={courseId}
            disabled={pending}
            onChange={(e) => {
              setCourse(e.target.value);
              setStudent("");
              setScore("");
            }}
          >
            {!courses.length && <option value="">No courses available</option>}
            {courses.map((c) => (
              <option value={c.id} key={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade-student">Student</Label>
          <select
            id="grade-student"
            className="field"
            value={studentId}
            disabled={pending}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="">Select a student</option>
            {roster.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {student && course ? (
        <Panel
          title={`${student.name} · ${course.code}`}
          description={course.semester}
          className="max-w-3xl"
        >
          <form onSubmit={save} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade-score">Score</Label>
                <Input
                  id="grade-score"
                  type="number"
                  required
                  min={0}
                  max={Number(maxScore)}
                  step="0.01"
                  value={score}
                  disabled={pending}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade-max">Maximum score</Label>
                <Input
                  id="grade-max"
                  type="number"
                  required
                  min={1}
                  max={10000}
                  step="0.01"
                  value={maxScore}
                  disabled={pending}
                  onChange={(e) => setMaxScore(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A+ ≥90% · A ≥80% · B ≥70% · C ≥60% · D ≥50% · F &lt;50%
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save grade"}
            </Button>
          </form>
        </Panel>
      ) : (
        <div className="bg-card border rounded-lg">
          <EmptyState
            title={
              roster.length
                ? "Choose a student to enter a result"
                : "No enrolled students"
            }
            description="Course results appear in the student’s academic performance page. Assignment feedback is managed separately."
          />
        </div>
      )}
    </div>
  );
}
