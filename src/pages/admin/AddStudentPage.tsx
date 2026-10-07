import { useNavigate } from "react-router-dom";
import StudentForm from "@/components/StudentForm";
import { PageHeader, Panel } from "@/components/WorkspaceUI";
export default function AddStudentPage() {
  const navigate = useNavigate();
  return (
    <div className="page-stack max-w-3xl">
      <PageHeader
        title="Enroll a student"
        description="Create their academic record and a secure portal account."
      />
      <Panel title="Student information">
        <StudentForm onSaved={() => navigate("/admin/students")} />
      </Panel>
    </div>
  );
}
