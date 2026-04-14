import { getStudents } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

export default function RankingPage() {
  const students = getStudents()
    .filter(s => s.grades.length > 0)
    .map(s => ({
      ...s,
      avg: s.grades.reduce((sum, g) => sum + g.score, 0) / s.grades.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif tracking-tight">Student Rankings</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Average Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {i < 3 && <Trophy className={`size-4 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`} />}
                      <span className="font-serif font-medium">#{i + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell>Year {s.year}</TableCell>
                  <TableCell className="text-right font-medium">{s.avg.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
