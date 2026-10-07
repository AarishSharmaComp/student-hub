import { useHubData, attendancePercent, averageScore } from "@/lib/store";
import { PageHeader, Panel, EmptyState } from "@/components/WorkspaceUI";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
export default function StatisticsPage() {
  const { students } = useHubData();
  const departments = [...new Set(students.map((s) => s.course))];
  const rows = departments.map((name) => {
    const records = students.filter((s) => s.course === name);
    return {
      name,
      count: records.length,
      attendance: mean(records.map(attendancePercent)),
      score: mean(records.map(averageScore)),
    };
  });
  return (
    <div className="page-stack">
      <PageHeader
        title="Academic statistics"
        description="Compare department participation and results. Students with no recorded data are excluded from the respective averages."
      />
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Avg. attendance</TableHead>
              <TableHead>Avg. course score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell>
                  {r.attendance === null ? "—" : `${r.attendance.toFixed(1)}%`}
                </TableCell>
                <TableCell>
                  {r.score === null ? "—" : `${r.score.toFixed(1)}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rows.length && <EmptyState title="No student records yet" />}
      </div>
      <Panel title="Academic year distribution">
        <div className="grid sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((year) => (
            <div key={year} className="p-4 rounded-md bg-muted">
              <p className="text-xs text-muted-foreground">Year {year}</p>
              <p className="text-2xl font-semibold mt-3">
                {students.filter((s) => s.year === year).length}
              </p>
              <div className="h-1.5 bg-border rounded-full mt-3">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${students.length ? (students.filter((s) => s.year === year).length / students.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
function mean(values: (number | null)[]) {
  const v = values.filter((n): n is number => n !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
