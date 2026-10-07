import { useHubData } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/WorkspaceUI";
import { Card, CardContent } from "@/components/ui/card";

export default function CourseStrengthPage() {
  const { students } = useHubData();
  const courses = [...new Set(students.map((s) => s.course))];
  const data = courses
    .map((course) => ({
      course,
      total: students.filter((s) => s.course === course).length,
      active: students.filter(
        (s) => s.course === course && s.status === "active",
      ).length,
    }))
    .sort((a, b) => b.total - a.total);

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department strength"
        description="Student distribution by department and account status."
      />
      {!data.length && <EmptyState title="No student records yet" />}
      <div className="space-y-4">
        {data.map((d) => (
          <Card key={d.course}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{d.course}</span>
                <span className="text-sm text-muted-foreground">
                  {d.total} students ({d.active} active)
                </span>
              </div>
              <div className="h-3 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(d.total / max) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
