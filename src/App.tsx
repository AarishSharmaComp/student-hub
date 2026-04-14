import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/AdminLayout";
import StudentLayout from "./components/StudentLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddStudentPage from "./pages/admin/AddStudentPage";
import ViewStudentsPage from "./pages/admin/ViewStudentsPage";
import SearchStudentPage from "./pages/admin/SearchStudentPage";
import AttendancePage from "./pages/admin/AttendancePage";
import GradesPage from "./pages/admin/GradesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import ExportPage from "./pages/admin/ExportPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
import RankingPage from "./pages/admin/RankingPage";
import CourseTopperPage from "./pages/admin/CourseTopperPage";
import CourseStrengthPage from "./pages/admin/CourseStrengthPage";
import AttendanceReportPage from "./pages/admin/AttendanceReportPage";
import StudentDetailsPage from "./pages/student/StudentDetailsPage";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentGradesPage from "./pages/student/StudentGradesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'admin' | 'student' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace /> : <LoginPage />} />
      
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="add" element={<AddStudentPage />} />
        <Route path="students" element={<ViewStudentsPage />} />
        <Route path="search" element={<SearchStudentPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="toppers" element={<CourseTopperPage />} />
        <Route path="strength" element={<CourseStrengthPage />} />
        <Route path="attendance-report" element={<AttendanceReportPage />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDetailsPage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="grades" element={<StudentGradesPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
