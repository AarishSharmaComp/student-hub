import { useState } from 'react';
import { getStudents, updateStudent } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Student } from '@/types/student';

export default function GradesPage() {
  const [students] = useState(getStudents());
  const [selectedId, setSelectedId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Student['grades']>([]);
  const { toast } = useToast();

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const s = students.find(st => st.id === id);
    if (s) {
      setStudent(s);
      setGrades([...s.grades]);
    }
  };

  const handleScoreChange = (idx: number, score: string) => {
    const newGrades = [...grades];
    const val = parseInt(score) || 0;
    newGrades[idx] = { ...newGrades[idx], score: val, grade: getGrade(val) };
    setGrades(newGrades);
  };

  const handleSave = () => {
    if (!student) return;
    updateStudent(student.id, { grades });
    toast({ title: 'Grades Updated', description: `Grades saved for ${student.name}` });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif tracking-tight">Grades Management</h1>
      <Select value={selectedId} onValueChange={handleSelect}>
        <SelectTrigger className="max-w-sm"><SelectValue placeholder="Select a student" /></SelectTrigger>
        <SelectContent>
          {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.course}</SelectItem>)}
        </SelectContent>
      </Select>

      {student && grades.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((g, i) => (
                  <TableRow key={g.subject}>
                    <TableCell className="font-medium">{g.subject}</TableCell>
                    <TableCell><Input type="number" value={g.score} onChange={e => handleScoreChange(i, e.target.value)} className="w-20" min={0} max={100} /></TableCell>
                    <TableCell>{g.maxScore}</TableCell>
                    <TableCell><span className={`font-bold ${g.grade === 'F' ? 'text-destructive' : g.grade.startsWith('A') ? 'text-success' : ''}`}>{g.grade}</span></TableCell>
                    <TableCell>{g.semester}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Average: {(grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)}</p>
              <Button onClick={handleSave}>Save Grades</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
