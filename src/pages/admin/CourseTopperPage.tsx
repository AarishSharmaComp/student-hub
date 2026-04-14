import { getStudents } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function CourseTopperPage() {
  const students = getStudents();
  const courses = [...new Set(students.map(s => s.course))];

  const toppers = courses.map(course => {
    const cs = students.filter(s => s.course === course && s.grades.length > 0);
    if (!cs.length) return { course, topper: null, avg: 0 };
    const sorted = cs.map(s => ({ ...s, avg: s.grades.reduce((sum, g) => sum + g.score, 0) / s.grades.length })).sort((a, b) => b.avg - a.avg);
    return { course, topper: sorted[0], avg: sorted[0].avg };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif tracking-tight">Course Toppers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {toppers.map(t => (
          <Card key={t.course}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">{t.course}</p>
                  {t.topper ? (
                    <>
                      <p className="text-lg font-serif font-medium">{t.topper.name}</p>
                      <p className="text-sm text-muted-foreground">Year {t.topper.year} · Avg: {t.avg.toFixed(1)}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">No data available</p>
                  )}
                </div>
                <Trophy className="size-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
