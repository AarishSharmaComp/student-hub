import { useHubData, attendancePercent, averageScore } from "@/lib/store";
import { PageHeader } from "@/components/WorkspaceUI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const { students } = useHubData();

  const lowAttendance = students.filter((s) => {
    if (!s.attendance.length) return false;
    return attendancePercent(s)! < 75;
  });

  const lowGrades = students.filter((s) => {
    if (!s.grades.length) return false;
    return averageScore(s)! < 50;
  });

  const topPerformers = [...students]
    .filter((s) => s.grades.length > 0)
    .map((s) => ({ ...s, avg: averageScore(s)! }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic reports"
        description="Find students who may need support and recognize strong academic performance. Missing data is excluded from averages."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">
              Low Attendance ({"<"}75%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowAttendance.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No students below threshold
              </p>
            ) : (
              <div className="space-y-2">
                {lowAttendance.map((s) => {
                  const pct = (
                    (s.attendance.filter((a) => a.status === "present").length /
                      s.attendance.length) *
                    100
                  ).toFixed(1);
                  return (
                    <div
                      key={s.id}
                      className="flex justify-between py-2 border-b border-border last:border-0 text-sm"
                    >
                      <span>{s.name}</span>
                      <span className="text-destructive font-medium">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">
              Low Grades ({"<"}50 avg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowGrades.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No students below threshold
              </p>
            ) : (
              <div className="space-y-2">
                {lowGrades.map((s) => {
                  const avg = averageScore(s)!.toFixed(1);
                  return (
                    <div
                      key={s.id}
                      className="flex justify-between py-2 border-b border-border last:border-0 text-sm"
                    >
                      <span>{s.name}</span>
                      <span className="text-destructive font-medium">
                        {avg}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-serif">
              Top 5 Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!topPerformers.length && (
                <p className="text-sm text-muted-foreground">
                  No published results yet.
                </p>
              )}
              {topPerformers.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-serif text-primary font-medium w-6">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.course}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-success">
                    {s.avg.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
