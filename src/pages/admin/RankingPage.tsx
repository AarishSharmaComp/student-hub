import { useHubData, averageScore } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/WorkspaceUI";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy } from "lucide-react";

export default function RankingPage() {
  const { students: records } = useHubData();
  const students = [...records]
    .filter((s) => s.grades.length > 0)
    .map((s) => ({
      ...s,
      avg: averageScore(s)!,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student rankings"
        description="Ranked by average normalized course score. Students without results are excluded."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Average score %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {i < 3 && (
                        <Trophy
                          className={`size-4 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-700"}`}
                        />
                      )}
                      <span className="font-serif font-medium">#{i + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell>Year {s.year}</TableCell>
                  <TableCell className="text-right font-medium">
                    {s.avg.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!students.length && <EmptyState title="No results to rank" />}
        </CardContent>
      </Card>
    </div>
  );
}
