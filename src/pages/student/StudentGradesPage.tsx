import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHubData, averageScore } from "@/lib/store";
import { PageHeader, Panel, EmptyState } from "@/components/WorkspaceUI";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export default function StudentGradesPage() {
  const { user } = useAuth();
  const { students, submissions, assignments } = useHubData();
  const student = students.find((s) => s.id === user?.studentId);
  const [semester, setSemester] = useState("");
  if (!student) return <EmptyState title="Academic record unavailable" />;
  const grades = student.grades.filter(
    (g) => !semester || g.semester === semester,
  );
  const avg = averageScore({ ...student, grades });
  const graded = submissions.filter((s) => s.score !== null);
  return (
    <div className="page-stack">
      <PageHeader
        title="Academic performance"
        description="Published course results and assignment feedback. Percentages reflect the recorded marking scale."
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <Panel title="Average course score">
          <p className="text-3xl font-semibold">
            {avg === null ? "—" : `${avg.toFixed(1)}%`}
          </p>
        </Panel>
        <Panel title="Published results">
          <p className="text-3xl font-semibold">{grades.length}</p>
        </Panel>
        <Panel title="Graded assignments">
          <p className="text-3xl font-semibold">{graded.length}</p>
        </Panel>
      </div>
      <section className="border bg-card rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <select
            className="field max-w-xs"
            aria-label="Filter grades by semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="">All semesters</option>
            {[...new Set(student.grades.map((g) => g.semester))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course / subject</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Semester</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g) => (
              <TableRow key={`${g.courseId}-${g.subject}-${g.semester}`}>
                <TableCell className="font-medium">{g.subject}</TableCell>
                <TableCell>
                  {g.score}/{g.maxScore}
                </TableCell>
                <TableCell>
                  {((g.score / g.maxScore) * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  {g.grade}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {g.semester}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!grades.length && (
          <EmptyState
            title="No results published yet"
            description="Your teacher will publish your academic results here."
          />
        )}
      </section>
      <Panel title="Assignment feedback">
        {graded.length ? (
          <div className="divide-y">
            {graded.map((s) => (
              <div className="py-4 first:pt-0" key={s.assignmentId}>
                <div className="flex justify-between gap-4">
                  <h3 className="text-sm font-medium">
                    {assignments.find((a) => a.id === s.assignmentId)?.title}
                  </h3>
                  <p className="text-sm font-semibold">
                    {s.score}/
                    {assignments.find((a) => a.id === s.assignmentId)?.maxScore}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {s.feedback || "No written feedback provided."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No assignment feedback yet" />
        )}
      </Panel>
      <p className="text-xs text-muted-foreground">
        GPA is not calculated because an institutional grade-point policy has
        not been configured.
      </p>
    </div>
  );
}
