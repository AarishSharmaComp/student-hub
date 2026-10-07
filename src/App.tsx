import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/AdminLayout";
import StudentLayout from "./components/StudentLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "./pages/NotFound";
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AddStudentPage = lazy(() => import("./pages/admin/AddStudentPage"));
const ViewStudentsPage = lazy(() => import("./pages/admin/ViewStudentsPage"));
const SearchStudentPage = lazy(() => import("./pages/admin/SearchStudentPage"));
const AttendancePage = lazy(() => import("./pages/admin/AttendancePage"));
const GradesPage = lazy(() => import("./pages/admin/GradesPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const ExportPage = lazy(() => import("./pages/admin/ExportPage"));
const StatisticsPage = lazy(() => import("./pages/admin/StatisticsPage"));
const RankingPage = lazy(() => import("./pages/admin/RankingPage"));
const CourseTopperPage = lazy(() => import("./pages/admin/CourseTopperPage"));
const CourseStrengthPage = lazy(
  () => import("./pages/admin/CourseStrengthPage"),
);
const AttendanceReportPage = lazy(
  () => import("./pages/admin/AttendanceReportPage"),
);
const StudentDetailsPage = lazy(
  () => import("./pages/student/StudentDetailsPage"),
);
const StudentAttendancePage = lazy(
  () => import("./pages/student/StudentAttendancePage"),
);
const StudentGradesPage = lazy(
  () => import("./pages/student/StudentGradesPage"),
);
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailsPage = lazy(() =>
  import("./pages/CoursesPage").then((m) => ({ default: m.CourseDetailsPage })),
);
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const AssignmentDetailsPage = lazy(() =>
  import("./pages/AssignmentsPage").then((m) => ({
    default: m.AssignmentDetailsPage,
  })),
);
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "student";
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role === "admin" ? user.role === "student" : user.role !== "student")
    return (
      <Navigate to={user.role === "student" ? "/student" : "/admin"} replace />
    );
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={user.role === "student" ? "/student" : "/admin"}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="add"
          element={
            user?.role === "admin" ? (
              <AddStudentPage />
            ) : (
              <Navigate to="/admin/students" replace />
            )
          }
        />
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
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/:id" element={<AssignmentDetailsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="profile" element={<StudentDetailsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="grades" element={<StudentGradesPage />} />
        <Route path="profile" element={<StudentDetailsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/:id" element={<AssignmentDetailsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <ErrorBoundary>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div
                  className="p-8 space-y-5"
                  role="status"
                  aria-label="Loading page"
                >
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <span className="sr-only">Loading page…</span>
                </div>
              }
            >
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  </ThemeProvider>
);

export default App;
