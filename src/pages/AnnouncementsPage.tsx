import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHubData, mutate } from "@/lib/store";
import { Announcement } from "@/types/student";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
  ConfirmDialog,
  Pagination,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { announcements, courses } = useHubData();
  const student = user?.role === "student";
  const [filter, setFilter] = useState("");
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [reading, setReading] = useState("");
  const filtered = announcements.filter(
    (a) =>
      (!course || a.courseId === course) &&
      (filter === "unread"
        ? !a.read
        : filter === "important"
          ? a.important
          : true),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const read = async (id: string) => {
    setReading(id);
    try {
      await mutate(`/announcements/${id}/read`, "PUT", {});
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReading("");
    }
  };
  return (
    <div className="page-stack max-w-5xl">
      <PageHeader
        title="Announcements"
        description="Stay connected with course updates and important academic information."
        action={
          !student && (
            <Button
              onClick={() => setCreating(true)}
              disabled={user?.role === "teacher" && !courses.length}
            >
              <Plus className="size-4 mr-2" />
              Publish announcement
            </Button>
          )
        }
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="field sm:w-60"
          aria-label="Filter announcements"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All announcements</option>
          <option value="unread">Unread</option>
          <option value="important">Important</option>
        </select>
        <select
          className="field sm:w-64"
          aria-label="Filter announcements by course"
          value={course}
          onChange={(e) => {
            setCourse(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All audiences</option>
          {courses.map((c) => (
            <option value={c.id} key={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {filtered.slice((safePage - 1) * 10, safePage * 10).map((a) => (
          <article
            key={a.id}
            className={`bg-card rounded-lg border p-5 sm:p-6 ${a.important ? "border-l-[3px] border-l-warning" : ""}`}
          >
            <div className="flex flex-wrap gap-2 items-center mb-3">
              {a.important && <StatusBadge>Important</StatusBadge>}
              {!a.read && (
                <span className="text-xs text-primary font-medium">Unread</span>
              )}
              <span className="text-xs text-muted-foreground">
                {a.courseId
                  ? courses.find((c) => c.id === a.courseId)?.code
                  : "Institution-wide"}
              </span>
            </div>
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="text-xs text-muted-foreground mt-2">
              {a.author} · {new Date(a.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed mt-5">
              {a.body}
            </p>
            <div className="flex justify-between gap-3 items-center border-t pt-4 mt-5">
              <div>
                {a.read ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="size-3" />
                    Read
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reading === a.id}
                    onClick={() => read(a.id)}
                  >
                    {reading === a.id ? "Saving…" : "Mark as read"}
                  </Button>
                )}
              </div>
              {!student &&
                (user?.role === "admin" || a.authorId === user?.id) && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${a.title}`}
                      onClick={() => setEditing(a)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${a.title}`}
                      onClick={() => setDeleting(a)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="border bg-card rounded-lg">
          <EmptyState
            title={
              announcements.length
                ? "No announcements match this view"
                : "No announcements yet"
            }
            description="Updates from your academic team will appear here."
          />
        </div>
      )}
      <Pagination page={safePage} total={filtered.length} onChange={setPage} />
      <Dialog
        open={creating || !!editing}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit announcement" : "Publish announcement"}
            </DialogTitle>
            <DialogDescription>
              Teachers publish to their own courses. Administrators can also
              publish institution-wide.
            </DialogDescription>
          </DialogHeader>
          <AnnouncementForm
            key={editing?.id ?? "new"}
            announcement={editing ?? undefined}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete announcement?"
        description="The announcement and its read receipts will be permanently removed."
        onConfirm={async () => {
          await mutate(`/announcements/${deleting!.id}`, "DELETE");
          toast.success("Announcement deleted");
        }}
      />
    </div>
  );
}
function AnnouncementForm({
  announcement,
  onSaved,
}: {
  announcement?: Announcement;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { courses } = useHubData();
  const [form, setForm] = useState({
    courseId:
      announcement?.courseId ??
      (user?.role === "admin" ? "" : (courses[0]?.id ?? "")),
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    important: announcement?.important ?? false,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await mutate(
        announcement ? `/announcements/${announcement.id}` : "/announcements",
        announcement ? "PATCH" : "POST",
        { ...form, courseId: form.courseId || null },
      );
      toast.success(
        announcement ? "Announcement updated" : "Announcement published",
      );
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={pending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="announcement-audience">Audience</Label>
          <select
            id="announcement-audience"
            className="field"
            value={form.courseId}
            onChange={(e) =>
              setForm((p) => ({ ...p, courseId: e.target.value }))
            }
          >
            {user?.role === "admin" && (
              <option value="">Institution-wide</option>
            )}
            {courses.map((c) => (
              <option value={c.id} key={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="announcement-title">Title</Label>
          <Input
            id="announcement-title"
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="announcement-body">Message</Label>
          <Textarea
            id="announcement-body"
            required
            rows={7}
            maxLength={10000}
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          />
        </div>
        <label className="flex gap-3 items-center text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={form.important}
            onChange={(e) =>
              setForm((p) => ({ ...p, important: e.target.checked }))
            }
          />
          Mark as important
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Saving…"
          : announcement
            ? "Save changes"
            : "Publish announcement"}
      </Button>
    </form>
  );
}
