import { useState } from "react";
import { Inbox, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && <p className="section-label mb-2">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("bg-card border rounded-lg overflow-hidden", className)}
    >
      <div className="flex items-center justify-between gap-4 p-5 border-b">
        <div>
          <h2 className="font-semibold text-base">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center px-4 py-10">
      <Inbox
        className="size-8 text-muted-foreground mx-auto mb-3"
        aria-hidden="true"
      />
      <h3 className="font-medium text-sm">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function StatusBadge({ children }: { children: React.ReactNode }) {
  const value = String(children).toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap",
        ["active", "present", "graded", "submitted"].includes(value)
          ? "bg-success/10 text-success"
          : ["late", "overdue", "important"].includes(value)
            ? "bg-warning/10 text-warning"
            : value === "absent"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
export function Pagination({
  page,
  total,
  onChange,
  pageSize = 10,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
  pageSize?: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
      <p role="status">
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
          : "0 results"}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span>
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => Promise<unknown>;
}) {
  const [pending, setPending] = useState(false);
  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !pending) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {pending && <Loader2 className="size-4 mr-2 animate-spin" />}Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
