import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHubData, attendancePercent } from "@/lib/store";
import {
  PageHeader,
  Panel,
  EmptyState,
  Pagination,
  StatusBadge,
} from "@/components/WorkspaceUI";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { students, courses } = useHubData();
  const student = students.find((s) => s.id === user?.studentId);
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);
  if (!student)
    return (
      <EmptyState
        title="Academic record unavailable"
        description="Contact your academic office."
      />
    );
  const records = student.attendance
    .filter((a) => !course || a.courseId === course)
    .sort((a, b) => b.date.localeCompare(a.date));
  const pct = attendancePercent({ ...student, attendance: records });
  return (
    <div className="page-stack">
      <PageHeader
        title="My attendance"
        description="Track your participation and review your class records."
      />
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["Attendance", pct === null ? "—" : `${pct.toFixed(1)}%`],
          ["Present", records.filter((r) => r.status === "present").length],
          [
            "Absent / late",
            `${records.filter((r) => r.status === "absent").length} / ${records.filter((r) => r.status === "late").length}`,
          ],
        ].map(([label, value]) => (
          <Panel key={label} title={String(label)}>
            <p className="text-3xl font-semibold">{value}</p>
          </Panel>
        ))}
      </div>
      {pct !== null && pct < 75 && (
        <p
          role="status"
          className="text-sm text-warning bg-warning/5 border border-warning/25 p-4 rounded-lg"
        >
          Your attendance is below 75%. Contact your teacher for guidance.
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {courses.map((c) => {
          const att = attendancePercent({
            ...student,
            attendance: student.attendance.filter((a) => a.courseId === c.id),
          });
          return (
            <div key={c.id} className="border bg-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground">{c.code}</p>
              <p className="text-sm font-medium mt-1">{c.name}</p>
              <p className="text-lg font-semibold mt-3">
                {att === null ? "No records" : `${att.toFixed(1)}%`}
              </p>
            </div>
          );
        })}
      </div>
      <div className="border bg-card rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <select
            className="field sm:max-w-xs"
            value={course}
            aria-label="Filter attendance by course"
            onChange={(e) => {
              setCourse(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All courses and historical records</option>
            {courses.map((c) => (
              <option value={c.id} key={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.slice((page - 1) * 10, page * 10).map((r) => (
              <TableRow key={`${r.date}-${r.courseId ?? ""}`}>
                <TableCell>{r.date}</TableCell>
                <TableCell>
                  {courses.find((c) => c.id === r.courseId)?.name ??
                    "Historical attendance"}
                </TableCell>
                <TableCell>
                  <StatusBadge>{r.status}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!records.length && (
          <EmptyState
            title="No attendance records yet"
            description="Your teacher's recorded sessions will appear here."
          />
        )}
        <Pagination total={records.length} page={page} onChange={setPage} />
      </div>
      <p className="text-xs text-muted-foreground">
        Present sessions count toward attendance. Late sessions are tracked
        separately.
      </p>
    </div>
  );
}
