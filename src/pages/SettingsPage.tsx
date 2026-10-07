import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { api, mutate, downloadFile, useHubData } from "@/lib/store";
import { PageHeader, Panel } from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await api("/auth/password", "POST", {
        currentPassword: current,
        newPassword: password,
      });
      setCurrent("");
      setPassword("");
      setConfirm("");
      toast.success("Password updated. Other sessions have been signed out.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="page-stack max-w-4xl">
      <PageHeader
        title="Account settings"
        description="Manage your password and workspace preferences."
      />
      <Panel title="Appearance" description="Saved on this device.">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="theme">Color theme</Label>
          <select
            id="theme"
            className="field"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">Use device setting</option>
          </select>
        </div>
      </Panel>
      <Panel
        title="Change password"
        description="Use a unique password with at least 12 characters."
      >
        <form onSubmit={save} className="space-y-4 max-w-md">
          <fieldset disabled={pending} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={256}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Panel>
      {user?.role === "admin" && (
        <>
          <TeacherAccounts />
          <LegacyImport />
        </>
      )}
    </div>
  );
}
function TeacherAccounts() {
  const { teachers } = useHubData();
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await mutate("/teachers", "POST", form);
      setForm({ name: "", username: "", password: "" });
      toast.success("Teacher account created");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel
      title="Teacher accounts"
      description="Create a staff account, then assign it to courses in the catalog."
    >
      <div className="flex flex-wrap gap-2 mb-5">
        {teachers.map((t) => (
          <span className="text-xs border rounded px-2 py-1" key={t.id}>
            {t.name}
          </span>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={pending} className="grid sm:grid-cols-3 gap-4">
          {(
            [
              ["name", "Full name"],
              ["username", "Username"],
              ["password", "Initial password"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`teacher-${key}`}>{label}</Label>
              <Input
                id={`teacher-${key}`}
                type={key === "password" ? "password" : "text"}
                autoComplete={key === "password" ? "new-password" : "off"}
                required
                maxLength={key === "name" ? 120 : 254}
                minLength={key === "password" ? 12 : 1}
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            </div>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Initial passwords require at least 12 characters. Share credentials
          securely.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create teacher account"}
        </Button>
      </form>
    </Panel>
  );
}
function LegacyImport() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<
    { username: string; password: string }[]
  >([]);
  const existing = localStorage.getItem("sms_students");
  const importData = async () => {
    setPending(true);
    setError("");
    try {
      const students = JSON.parse(existing ?? "[]");
      const result = await mutate<{
        accounts: { username: string; password: string }[];
      }>("/import", "POST", { students });
      setAccounts(result.accounts);
      localStorage.removeItem("sms_users");
      toast.success(`${result.accounts.length} historical records imported`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel
      title="Import original browser records"
      description="Preserve data from the original Student Hub on this browser."
    >
      <p className="text-sm text-muted-foreground mb-4">
        Imports are additive and atomic. Duplicate IDs or emails stop the whole
        import. Historical attendance and grades are retained without inventing
        course relationships. New accounts use email usernames and generated
        passwords.
      </p>
      {accounts.length ? (
        <div className="space-y-3">
          <p role="status" className="text-sm">
            {accounts.length} records imported. Download the generated
            credentials now and store them securely.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              downloadFile(
                JSON.stringify(accounts, null, 2),
                "imported-student-credentials.json",
                "application/json",
              )
            }
          >
            Download generated credentials
          </Button>
        </div>
      ) : existing ? (
        <Button variant="outline" onClick={importData} disabled={pending}>
          {pending ? "Importing…" : "Import browser records"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          No original records found in this browser.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive mt-3">
          {error}
        </p>
      )}
    </Panel>
  );
}
