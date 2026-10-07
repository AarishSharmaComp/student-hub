import { exportStudentsCSV, downloadFile, useHubData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/WorkspaceUI";
import { Download } from "lucide-react";
import { toast } from "sonner";
export default function ExportPage() {
  const { students } = useHubData();
  return (
    <div className="page-stack max-w-3xl">
      <PageHeader
        title="Export academic records"
        description="Download the student records you are authorized to access."
      />
      <Panel
        title="Student directory · CSV"
        description={`${students.length} records available`}
      >
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Includes student information, attendance percentage, and average
          normalized course scores. Missing academic data is left blank.
          Exported text is escaped for safe spreadsheet use.
        </p>
        <Button
          onClick={() => {
            downloadFile(
              exportStudentsCSV(),
              `students-${new Date().toISOString().slice(0, 10)}.csv`,
            );
            toast.success("Student records downloaded");
          }}
          disabled={!students.length}
        >
          <Download className="size-4 mr-2" />
          Download CSV
        </Button>
      </Panel>
    </div>
  );
}
