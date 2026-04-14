import { getStudents } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, GraduationCap, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const students = getStudents();
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;

  const avgAttendance = students.reduce((sum, s) => {
    if (!s.attendance.length) return sum;
    return sum + (s.attendance.filter(a => a.status === 'present').length / s.attendance.length) * 100;
  }, 0) / (students.length || 1);

  const avgGPA = students.reduce((sum, s) => {
    if (!s.grades.length) return sum;
    return sum + s.grades.reduce((gs, g) => gs + g.score, 0) / s.grades.length;
  }, 0) / (students.length || 1);

  const atRisk = students.filter(s => {
    if (!s.attendance.length) return false;
    const att = (s.attendance.filter(a => a.status === 'present').length / s.attendance.length) * 100;
    return att < 75;
  }).length;

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-primary' },
    { label: 'Avg. Attendance', value: `${avgAttendance.toFixed(1)}%`, icon: UserCheck, color: 'text-success' },
    { label: 'Avg. Score', value: avgGPA.toFixed(1), icon: GraduationCap, color: 'text-primary' },
    { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-destructive' },
  ];

  const courseDistribution = COURSES_COUNT(students);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your institution's performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{stat.label}</span>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
              <p className="text-3xl font-serif">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-serif text-xl mb-4">Course Distribution</h3>
            <div className="space-y-3">
              {courseDistribution.map(({ course, count }) => (
                <div key={course} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate">{course}</span>
                  <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / totalStudents) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-serif text-xl mb-4">Recent Students</h3>
            <div className="space-y-3">
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.course}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    s.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>{s.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function COURSES_COUNT(students: any[]) {
  const map: Record<string, number> = {};
  students.forEach(s => { map[s.course] = (map[s.course] || 0) + 1; });
  return Object.entries(map).map(([course, count]) => ({ course, count })).sort((a, b) => b.count - a.count);
}
