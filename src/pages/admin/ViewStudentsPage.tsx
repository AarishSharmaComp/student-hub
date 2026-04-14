import { useState } from 'react';
import { getStudents, deleteStudent, updateStudent } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Student } from '@/types/student';

export default function ViewStudentsPage() {
  const [students, setStudents] = useState(getStudents());
  const [filter, setFilter] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.course.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteStudent(id);
    setStudents(getStudents());
    toast({ title: 'Student Deleted' });
  };

  const handleUpdate = () => {
    if (!editStudent) return;
    updateStudent(editStudent.id, editStudent);
    setStudents(getStudents());
    setEditStudent(null);
    toast({ title: 'Student Updated' });
  };

  const getAttendancePct = (s: Student) => {
    if (!s.attendance.length) return 0;
    return (s.attendance.filter(a => a.status === 'present').length / s.attendance.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-tight">Student Directory</h1>
        <Input placeholder="Filter by name or course..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell>Year {s.year}</TableCell>
                  <TableCell>{getAttendancePct(s).toFixed(1)}%</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>{s.status}</span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewStudent(s)}><Eye className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditStudent({ ...s })}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewStudent} onOpenChange={() => setViewStudent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Student Details</DialogTitle></DialogHeader>
          {viewStudent && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> {viewStudent.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {viewStudent.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {viewStudent.phone}</div>
                <div><span className="text-muted-foreground">Course:</span> {viewStudent.course}</div>
                <div><span className="text-muted-foreground">Year:</span> {viewStudent.year}</div>
                <div><span className="text-muted-foreground">Status:</span> {viewStudent.status}</div>
                <div><span className="text-muted-foreground">Enrolled:</span> {viewStudent.enrollmentDate}</div>
                <div><span className="text-muted-foreground">Attendance:</span> {getAttendancePct(viewStudent).toFixed(1)}%</div>
              </div>
              {viewStudent.grades.length > 0 && (
                <div>
                  <p className="font-medium mb-2 mt-4">Grades</p>
                  <div className="space-y-1">
                    {viewStudent.grades.map(g => (
                      <div key={g.subject} className="flex justify-between py-1 border-b border-border last:border-0">
                        <span>{g.subject}</span>
                        <span className="font-medium">{g.score}/{g.maxScore} ({g.grade})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Edit Student</DialogTitle></DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editStudent.name} onChange={e => setEditStudent({ ...editStudent, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={editStudent.email} onChange={e => setEditStudent({ ...editStudent, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={editStudent.phone} onChange={e => setEditStudent({ ...editStudent, phone: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStudent.status} onValueChange={v => setEditStudent({ ...editStudent, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button onClick={handleUpdate}>Save Changes</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
