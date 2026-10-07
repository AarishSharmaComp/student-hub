import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { login, demo } = useAuth();
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const u = await login(username, password);
      navigate(u.role === "student" ? "/student" : "/admin");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden lg:flex bg-sidebar text-white flex-col justify-between p-12 xl:p-16">
        <div className="flex gap-3 items-center">
          <GraduationCap className="size-8" />
          <span className="text-xl font-semibold">
            Student Hub<span className="text-teal-300">.</span>
          </span>
        </div>
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[.2em] text-teal-300 mb-6">
            A better academic everyday
          </p>
          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight">
            Your campus.
            <br />
            Connected.
          </h1>
          <p className="mt-6 text-slate-300 leading-relaxed">
            Less time keeping track. More time moving forward. A focused
            workspace for students, teachers, and the academic office.
          </p>
          <div className="mt-12 border-t border-white/15 pt-8 grid grid-cols-2 gap-6">
            <div>
              <BookOpen className="size-5 text-teal-300 mb-3" />
              <h2 className="text-sm font-medium">Learning, organized</h2>
              <p className="text-xs text-slate-400 mt-2">
                Courses, assignments, and feedback.
              </p>
            </div>
            <div>
              <ClipboardCheck className="size-5 text-teal-300 mb-3" />
              <h2 className="text-sm font-medium">Progress, in view</h2>
              <p className="text-xs text-slate-400 mt-2">
                Attendance and academic results.
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Built around your academic journey.
        </p>
      </section>
      <main className="flex items-center justify-center bg-card px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 text-primary mb-10">
            <GraduationCap className="size-7" />
            <span className="font-semibold text-xl">Student Hub</span>
          </div>
          <p className="section-label mb-3">Welcome to your workspace</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Sign in to Student Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-3 mb-8">
            Use your account to pick up where you left off.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={254}
                autoFocus
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={256}
                disabled={pending}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : null}
              {pending ? "Signing in…" : "Sign in"}
              {!pending && <ArrowRight className="size-4 ml-2" />}
            </Button>
          </form>
          {demo && (
            <div className="mt-8 rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-semibold mb-3">
                Explore the demo workspace
              </p>
              <dl className="space-y-2 text-xs">
                {[
                  ["Academic office", "admin", "admin123"],
                  ["Teacher", "teacher", "teacher123"],
                  ["Student", "aarav.sharma", "student123"],
                ].map(([label, u, p]) => (
                  <div key={u} className="flex flex-wrap justify-between gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>
                      <button
                        className="font-mono hover:text-primary underline underline-offset-4"
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setUsername(u);
                          setPassword(p);
                          setError("");
                        }}
                      >
                        {u} / {p}
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <p className="mt-8 text-xs text-muted-foreground">
            Need access? Contact your academic office.
          </p>
        </div>
      </main>
    </div>
  );
}
