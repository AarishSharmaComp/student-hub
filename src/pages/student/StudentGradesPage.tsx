import { useAuth } from '@/contexts/AuthContext';
import { getStudentById } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentGradesPage() {
  const { user } = useAuth();
  const student = user?.studentId ? getStudentById(user.studentId) : null;

  if (!student) return <p className="text-muted-foreground">Student not found</p>;

  const avg = student.grades.length
    ? (student.grades.reduce((s, g) => s + g.score, 0) / student.grades.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-tight">My Grades</h1>
        <div className="text-right">
          <p className="text-2xl font-serif">{avg}</p>
          <p className="text-xs text-muted-foreground">Average Score</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead>Semester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.grades.map(g => (
                <TableRow key={g.subject}>
                  <TableCell className="font-medium">{g.subject}</TableCell>
                  <TableCell className="text-center">{g.score}/{g.maxScore}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${g.grade === 'F' ? 'text-destructive' : g.grade.startsWith('A') ? 'text-success' : ''}`}>{g.grade}</span>
                  </TableCell>
                  <TableCell>{g.semester}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
