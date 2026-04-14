import { exportStudentsCSV } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExportPage() {
  const { toast } = useToast();

  const handleExport = () => {
    const csv = exportStudentsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: 'CSV file has been downloaded' });
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-3xl font-serif tracking-tight">Export Data</h1>
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <Download className="size-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">Export Student Data</p>
            <p className="text-sm text-muted-foreground">Download all student records as a CSV file including attendance and grade information.</p>
          </div>
          <Button onClick={handleExport} className="w-full">Download CSV</Button>
        </CardContent>
      </Card>
    </div>
  );
}
