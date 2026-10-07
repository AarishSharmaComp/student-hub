import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useHubData,
  deleteStudent,
  attendancePercent,
  averageScore,
} from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Student } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  EmptyState,
  Pagination,
  StatusBadge,
  ConfirmDialog,
} from "@/components/WorkspaceUI";
import StudentForm from "@/components/StudentForm";
import {
  Search,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ViewStudentsPage() {
  const { students, courses, enrollments } = useHubData();
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(query);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 200);
    return () => clearTimeout(id);
  }, [query]);
  const filtered = students
    .filter(
      (s) =>
        [s.name, s.email, s.id, s.course].some((v) =>
          v.toLowerCase().includes(debounced.toLowerCase().trim()),
        ) &&
        (!department || s.course === department) &&
        (!status || s.status === status),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={admin ? "Academic office" : "Your teaching roster"}
        title="Student directory"
        description={`${students.length} students${admin ? " across the institution" : " enrolled in your courses"}. Find a record or review academic progress.`}
        action={
          admin && (
            <Button asChild>
              <Link to="/admin/add">
                <Plus className="size-4 mr-2" />
                Enroll student
              </Link>
            </Button>
          )
        }
      />
      <section className="border rounded-lg bg-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              aria-label="Search students by name, ID, email, or department"
              placeholder="Search name, ID, email, department…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="field sm:w-52"
            aria-label="Filter by department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {[...new Set(students.map((s) => s.course))].sort().map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="field sm:w-36"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {["active", "inactive", "graduated"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex gap-2 items-center"
                  onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
                  aria-label={`Sort name ${sort === "asc" ? "descending" : "ascending"}`}
                >
                  Student
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice((safePage - 1) * 10, safePage * 10).map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <button
                    onClick={() => setViewing(s)}
                    className="text-left hover:text-primary"
                  >
                    <span className="font-medium block">{s.name}</span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      {s.email}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {s.course}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  Year {s.year}
                </TableCell>
                <TableCell>
                  {attendancePercent(s)?.toFixed(1) ?? "—"}
                  {s.attendance.length > 0 ? "%" : ""}
                </TableCell>
                <TableCell>
                  <StatusBadge>{s.status}</StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${s.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewing(s)}>
                        <Eye className="size-4 mr-2" />
                        View profile
                      </DropdownMenuItem>
                      {admin && (
                        <>
                          <DropdownMenuItem onClick={() => setEditing(s)}>
                            <Pencil className="size-4 mr-2" />
                            Edit student
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(s)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete student
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <EmptyState
            title={students.length ? "No matching students" : "No students yet"}
            description={
              students.length
                ? "Try a different search or reset your filters."
                : "Enrolled students will appear here."
            }
          />
        )}
        <Pagination
          page={safePage}
          total={filtered.length}
          onChange={setPage}
        />
      </section>
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>
              Update contact information and academic details.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <StudentForm
              key={editing.id}
              student={editing}
              onSaved={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Sheet
        open={!!viewing}
        onOpenChange={(v) => {
          if (!v) setViewing(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{viewing?.name}</SheetTitle>
            <SheetDescription>Academic record · {viewing?.id}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="space-y-6 mt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                {[
                  ["Email", viewing.email],
                  ["Phone", viewing.phone || "Not provided"],
                  ["Department", viewing.course],
                  ["Year", `Year ${viewing.year}`],
                  ["Enrollment date", viewing.enrollmentDate],
                  ["Status", viewing.status],
                  [
                    "Attendance",
                    `${attendancePercent(viewing)?.toFixed(1) ?? "—"}${viewing.attendance.length ? "%" : ""}`,
                  ],
                  [
                    "Average score",
                    `${averageScore(viewing)?.toFixed(1) ?? "—"}${viewing.grades.length ? "%" : ""}`,
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground text-xs mb-1">{k}</dt>
                    <dd className="break-words font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t pt-5">
                <h3 className="text-sm font-semibold mb-3">Enrolled courses</h3>
                {courses
                  .filter((c) =>
                    enrollments.some(
                      (e) => e.courseId === c.id && e.studentId === viewing.id,
                    ),
                  )
                  .map((c) => (
                    <div key={c.id} className="text-sm py-2">
                      <span className="text-muted-foreground mr-2">
                        {c.code}
                      </span>
                      {c.name}
                    </div>
                  ))}
              </div>
              <div className="border-t pt-5">
                <h3 className="text-sm font-semibold mb-3">Academic results</h3>
                {viewing.grades.length ? (
                  viewing.grades.map((g) => (
                    <div
                      key={`${g.courseId}-${g.subject}-${g.semester}`}
                      className="flex justify-between text-sm py-3 border-b"
                    >
                      <div>
                        {g.subject}
                        <p className="text-xs text-muted-foreground mt-1">
                          {g.semester}
                        </p>
                      </div>
                      <span>
                        {g.score}/{g.maxScore} · {g.grade}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No results recorded yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Their academic record, account, attendance, grades, and submissions will be permanently removed. This cannot be undone."
        onConfirm={async () => {
          await deleteStudent(deleting!.id);
          toast.success("Student deleted");
        }}
      />
    </div>
  );
}
