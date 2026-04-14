import { getStudents } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StatisticsPage() {
  const students = getStudents();
  const courses = [...new Set(students.map(s => s.course))];

  const courseStats = courses.map(course => {
    const cs = students.filter(s => s.course === course);
    const avgAtt = cs.reduce((sum, s) => {
      if (!s.attendance.length) return sum;
      return sum + (s.attendance.filter(a => a.status === 'present').length / s.attendance.length) * 100;
    }, 0) / (cs.length || 1);
    const avgGrade = cs.reduce((sum, s) => {
      if (!s.grades.length) return sum;
      return sum + s.grades.reduce((gs, g) => gs + g.score, 0) / s.grades.length;
    }, 0) / (cs.length || 1);
    return { course, count: cs.length, avgAtt, avgGrade };
  });

  const yearStats = [1, 2, 3, 4].map(year => ({
    year,
    count: students.filter(s => s.year === year).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif tracking-tight">Statistics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">By Course</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseStats.map(cs => (
                <div key={cs.course} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cs.course}</span>
                    <span className="text-muted-foreground">{cs.count} students</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Att:</span>
                      <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${cs.avgAtt}%` }} />
                      </div>
                      <span>{cs.avgAtt.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Grade:</span>
                      <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${cs.avgGrade}%` }} />
                      </div>
                      <span>{cs.avgGrade.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">By Year</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {yearStats.map(ys => (
                <div key={ys.year} className="flex items-center gap-4">
                  <span className="text-2xl font-serif text-primary w-10">Y{ys.year}</span>
                  <div className="flex-1 h-3 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(ys.count / students.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{ys.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
