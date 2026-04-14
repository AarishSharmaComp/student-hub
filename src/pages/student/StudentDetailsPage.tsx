import { useAuth } from '@/contexts/AuthContext';
import { getStudentById } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentDetailsPage() {
  const { user } = useAuth();
  const student = user?.studentId ? getStudentById(user.studentId) : null;

  if (!student) return <p className="text-muted-foreground">Student not found</p>;

  const attPct = student.attendance.length
    ? (student.attendance.filter(a => a.status === 'present').length / student.attendance.length * 100).toFixed(1)
    : '0';

  const avgScore = student.grades.length
    ? (student.grades.reduce((s, g) => s + g.score, 0) / student.grades.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-serif tracking-tight">My Details</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Name</span>{student.name}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Email</span>{student.email}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Phone</span>{student.phone}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Course</span>{student.course}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Year</span>Year {student.year}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Status</span>{student.status}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Enrollment</span>{student.enrollmentDate}</div>
            <div><span className="text-muted-foreground block text-xs uppercase tracking-widest mb-1">Attendance</span>{attPct}%</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-lg">Academic Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-2xl font-serif">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg. Score</p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-2xl font-serif">{attPct}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-2xl font-serif">{student.grades.length}</p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
