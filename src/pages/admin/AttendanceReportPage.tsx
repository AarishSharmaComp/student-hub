import { getStudents } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AttendanceReportPage() {
  const students = getStudents().map(s => {
    const total = s.attendance.length;
    const present = s.attendance.filter(a => a.status === 'present').length;
    const absent = s.attendance.filter(a => a.status === 'absent').length;
    const late = s.attendance.filter(a => a.status === 'late').length;
    const pct = total ? (present / total) * 100 : 0;
    return { ...s, total, present, absent, late, pct };
  }).sort((a, b) => a.pct - b.pct);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif tracking-tight">Attendance Report</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell className="text-center text-success">{s.present}</TableCell>
                  <TableCell className="text-center text-destructive">{s.absent}</TableCell>
                  <TableCell className="text-center text-warning">{s.late}</TableCell>
                  <TableCell className="text-center">{s.total}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${s.pct < 75 ? 'text-destructive' : s.pct < 85 ? 'text-warning' : 'text-success'}`}>
                      {s.pct.toFixed(1)}%
                    </span>
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
