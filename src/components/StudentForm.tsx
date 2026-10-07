import { useState } from "react";
import { Student } from "@/types/student";
import { addStudent, updateStudent, useHubData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentForm({
  student,
  onSaved,
}: {
  student?: Student;
  onSaved: () => void;
}) {
  const { courses } = useHubData();
  const [form, setForm] = useState({
    name: student?.name ?? "",
    email: student?.email ?? "",
    phone: student?.phone ?? "",
    course: student?.course ?? "",
    year: student?.year ?? 1,
    status: student?.status ?? "active",
    enrollmentDate:
      student?.enrollmentDate ?? new Date().toISOString().slice(0, 10),
    username: "",
    password: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof typeof form, value: string | number) =>
    setForm((p) => ({ ...p, [key]: value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      if (student) await updateStudent(student.id, form);
      else await addStudent(form);
      toast.success(student ? "Student updated" : "Student enrolled");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const departments = [
    ...new Set([
      ...courses.map((c) => c.department),
      "Computer Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "English Literature",
      "Economics",
      "Mechanical Engineering",
      form.course,
    ]),
  ].filter(Boolean);
  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="student-name">Full name</Label>
            <Input
              id="student-name"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-email">Email address</Label>
            <Input
              id="student-email"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(e) => field("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-phone">
              Phone <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="student-phone"
              type="tel"
              maxLength={40}
              value={form.phone}
              onChange={(e) => field("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-department">Department</Label>
            <select
              id="student-department"
              className="field"
              required
              value={form.course}
              onChange={(e) => field("course", e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-year">Academic year</Label>
            <select
              id="student-year"
              className="field"
              value={form.year}
              onChange={(e) => field("year", Number(e.target.value))}
            >
              {[1, 2, 3, 4].map((y) => (
                <option value={y} key={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-date">Enrollment date</Label>
            <Input
              id="student-date"
              type="date"
              required
              value={form.enrollmentDate}
              onChange={(e) => field("enrollmentDate", e.target.value)}
            />
          </div>
          {student && (
            <div className="space-y-2">
              <Label htmlFor="student-status">Account status</Label>
              <select
                id="student-status"
                className="field"
                value={form.status}
                onChange={(e) => field("status", e.target.value)}
              >
                {["active", "inactive", "graduated"].map((v) => (
                  <option value={v} key={v}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {!student && (
          <div className="border-t pt-5">
            <h2 className="font-medium text-sm mb-1">Student account</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Share these credentials securely. Course enrollment is managed
              from Courses.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-username">Username</Label>
                <Input
                  id="student-username"
                  autoComplete="off"
                  required
                  maxLength={254}
                  value={form.username}
                  onChange={(e) => field("username", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Initial password</Label>
                <Input
                  id="student-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={256}
                  value={form.password}
                  onChange={(e) => field("password", e.target.value)}
                  aria-describedby="password-help"
                />
                <p id="password-help" className="text-xs text-muted-foreground">
                  At least 12 characters.
                </p>
              </div>
            </div>
          </div>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin mr-2" />}
          {pending ? "Saving…" : student ? "Save changes" : "Enroll student"}
        </Button>
      </div>
    </form>
  );
}
