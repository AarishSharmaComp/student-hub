import { useState } from 'react';
import { getStudents, updateStudent } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

export default function AttendancePage() {
  const [students, setStudents] = useState(getStudents());
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const { toast } = useToast();

  const handleMark = (id: string, status: 'present' | 'absent' | 'late') => {
    setMarks(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = () => {
    Object.entries(marks).forEach(([id, status]) => {
      const student = students.find(s => s.id === id);
      if (student) {
        const existing = student.attendance.findIndex(a => a.date === date);
        const attendance = [...student.attendance];
        if (existing >= 0) attendance[existing] = { date, status };
        else attendance.push({ date, status });
        updateStudent(id, { attendance });
      }
    });
    setStudents(getStudents());
    setMarks({});
    toast({ title: 'Attendance Saved', description: `Recorded for ${date}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Date: {date}</p>
        </div>
        <Button onClick={handleSave} disabled={Object.keys(marks).length === 0}>Save Attendance</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Current %</TableHead>
                <TableHead>Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.filter(s => s.status === 'active').map(s => {
                const pct = s.attendance.length ? (s.attendance.filter(a => a.status === 'present').length / s.attendance.length * 100).toFixed(1) : '—';
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.course}</TableCell>
                    <TableCell>{pct}%</TableCell>
                    <TableCell>
                      <Select value={marks[s.id] || ''} onValueChange={v => handleMark(s.id, v as any)}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
