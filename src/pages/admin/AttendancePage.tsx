import { useState } from "react";
import { useHubData, mutate, attendancePercent } from "@/lib/store";
import { AttendanceRecord } from "@/types/student";
import { PageHeader, EmptyState, StatusBadge } from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
export default function AttendancePage() {
  const { students, courses, enrollments } = useHubData();
  const [courseId, setCourse] = useState(courses[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<
    Record<string, AttendanceRecord["status"]>
  >({});
  const [pending, setPending] = useState(false);
  const roster = students.filter(
    (s) =>
      s.status === "active" &&
      enrollments.some((e) => e.courseId === courseId && e.studentId === s.id),
  );
  const save = async () => {
    setPending(true);
    try {
      await mutate("/attendance", "PUT", {
        courseId,
        date,
        marks: Object.entries(marks).map(([studentId, status]) => ({
          studentId,
          status,
        })),
      });
      setMarks({});
      toast.success("Attendance saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="page-stack">
      <PageHeader
        title="Attendance"
        description="Record a class session or correct a previous date. Only enrolled, active students are listed."
        action={
          <Button
            onClick={save}
            disabled={pending || !Object.keys(marks).length}
          >
            {pending
              ? "Saving…"
              : `Save attendance${Object.keys(marks).length ? ` (${Object.keys(marks).length})` : ""}`}
          </Button>
        }
      />
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-2 w-full sm:max-w-sm">
          <Label htmlFor="attendance-course">Course</Label>
          <select
            id="attendance-course"
            className="field"
            value={courseId}
            disabled={pending}
            onChange={(e) => {
              setCourse(e.target.value);
              setMarks({});
            }}
          >
            {!courses.length && <option value="">No courses available</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 w-full sm:w-auto">
          <Label htmlFor="attendance-date">Class date</Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            disabled={pending}
            onChange={(e) => {
              setDate(e.target.value);
              setMarks({});
            }}
          />
        </div>
        <Button
          variant="outline"
          disabled={pending || !roster.length}
          onClick={() =>
            setMarks(Object.fromEntries(roster.map((s) => [s.id, "present"])))
          }
        >
          Mark all present
        </Button>
      </div>
      <section className="border bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course attendance</TableHead>
              <TableHead>Saved status</TableHead>
              <TableHead>Mark attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.map((s) => {
              const record = s.attendance.find(
                (a) => a.courseId === courseId && a.date === date,
              );
              const pct = attendancePercent({
                ...s,
                attendance: s.attendance.filter((a) => a.courseId === courseId),
              });
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {s.name}
                  </TableCell>
                  <TableCell>
                    {pct?.toFixed(1) ?? "—"}
                    {pct !== null ? "%" : ""}
                  </TableCell>
                  <TableCell>
                    {record ? (
                      <StatusBadge>{record.status}</StatusBadge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not recorded
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <select
                      className="field w-36"
                      aria-label={`Attendance for ${s.name}`}
                      disabled={pending}
                      value={marks[s.id] ?? record?.status ?? ""}
                      onChange={(e) =>
                        setMarks((p) => ({
                          ...p,
                          [s.id]: e.target.value as AttendanceRecord["status"],
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      {["present", "absent", "late"].map((v) => (
                        <option value={v} key={v}>
                          {v[0].toUpperCase() + v.slice(1)}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!roster.length && (
          <EmptyState
            title="No students to mark"
            description="Select a course with active enrolled students. The academic office manages course enrollment."
          />
        )}
      </section>
      <p className="text-xs text-muted-foreground">
        Attendance policy: present sessions count toward the percentage; late
        sessions are tracked separately.
      </p>
    </div>
  );
}
