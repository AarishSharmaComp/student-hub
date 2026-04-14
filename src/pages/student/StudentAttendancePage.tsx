import { useAuth } from '@/contexts/AuthContext';
import { getStudentById } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const student = user?.studentId ? getStudentById(user.studentId) : null;

  if (!student) return <p className="text-muted-foreground">Student not found</p>;

  const records = [...student.attendance].sort((a, b) => b.date.localeCompare(a.date));
  const present = records.filter(r => r.status === 'present').length;
  const pct = records.length ? (present / records.length * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-tight">My Attendance</h1>
        <div className="text-right">
          <p className="text-2xl font-serif">{pct}%</p>
          <p className="text-xs text-muted-foreground">Overall Attendance</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.slice(0, 30).map(r => (
                <TableRow key={r.date}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'present' ? 'bg-success/10 text-success' :
                      r.status === 'late' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>{r.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
