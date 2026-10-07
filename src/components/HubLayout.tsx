import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  Download,
  Trophy,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useHubData, loadData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HubLayout() {
  const { user, logout, demo } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { announcements } = useHubData();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success("Workspace is up to date");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };
  const location = useLocation();
  const student = user?.role === "student";
  const admin = user?.role === "admin";
  const base = student ? "/student" : "/admin";
  const groups = [
    {
      label: "Workspace",
      items: [
        { label: "Overview", path: base, icon: LayoutDashboard, end: true },
        ...(!student
          ? [{ label: "Students", path: base + "/students", icon: Users }]
          : []),
        { label: "Courses", path: base + "/courses", icon: BookOpen },
        {
          label: "Assignments",
          path: base + "/assignments",
          icon: ClipboardCheck,
        },
        {
          label: "Attendance",
          path: base + "/attendance",
          icon: ClipboardList,
        },
        { label: "Grades", path: base + "/grades", icon: GraduationCap },
        {
          label: "Announcements",
          path: base + "/announcements",
          icon: Megaphone,
        },
      ],
    },
    ...(!student
      ? [
          {
            label: "Insights",
            items: [
              { label: "Reports", path: base + "/reports", icon: BarChart3 },
              {
                label: "Statistics",
                path: base + "/statistics",
                icon: BarChart3,
              },
              { label: "Rankings", path: base + "/ranking", icon: Trophy },
              {
                label: "Course toppers",
                path: base + "/toppers",
                icon: Trophy,
              },
              {
                label: "Course strength",
                path: base + "/strength",
                icon: Users,
              },
              {
                label: "Attendance report",
                path: base + "/attendance-report",
                icon: UserCheck,
              },
              {
                label: "Export records",
                path: base + "/export",
                icon: Download,
              },
            ],
          },
        ]
      : []),
    {
      label: "Account",
      items: [
        { label: "Profile", path: base + "/profile", icon: UserCircle },
        { label: "Settings", path: base + "/settings", icon: Settings },
      ],
    },
  ];
  const allItems = groups.flatMap((g) => g.items);
  const current =
    allItems.find((i) => i.path === location.pathname)?.label ||
    (location.pathname.endsWith("/add")
      ? "Add student"
      : location.pathname.endsWith("/search")
        ? "Search students"
        : "Workspace");
  useEffect(() => {
    document.title = `${current} · Student Hub`;
  }, [current]);
  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSigningOut(false);
    }
  };
  const navigation = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center">
          <GraduationCap className="size-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">
            Student Hub<span className="text-teal-300">.</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Your academic workspace
          </p>
        </div>
      </div>
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-3 py-5 space-y-5"
      >
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={"end" in item && item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors duration-150",
                      isActive
                        ? "bg-sidebar-accent text-white font-medium"
                        : "hover:bg-white/5 hover:text-white",
                    )
                  }
                >
                  <item.icon
                    className="size-[18px] shrink-0"
                    aria-hidden="true"
                  />
                  {item.label}
                  {item.label === "Announcements" &&
                    announcements.some((a) => !a.read) && (
                      <span
                        className="ml-auto size-1.5 bg-teal-300 rounded-full"
                        aria-label="Unread announcements"
                      />
                    )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 mb-2">
          <div className="size-9 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {user?.name}
            </p>
            <p className="text-xs capitalize text-slate-400">
              {user?.role === "admin" ? "Academic office" : user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-xs hover:bg-white/5 disabled:opacity-50"
        >
          <LogOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-card focus:p-4"
      >
        Skip to content
      </a>
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 z-30">
        {navigation}
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 border-sidebar-border bg-sidebar [&>button]:text-white"
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate your Student Hub workspace.
          </SheetDescription>
          {navigation}
        </SheetContent>
      </Sheet>
      <div className="lg:pl-60 min-w-0">
        <header className="sticky top-0 z-20 h-16 border-b bg-card flex items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {student
                ? "Student portal"
                : admin
                  ? "Academic office"
                  : "Teacher portal"}
            </span>
            <ChevronRight className="size-3 text-muted-foreground hidden sm:block" />
            <span className="text-sm font-medium truncate">{current}</span>
          </div>
          <div className="flex items-center gap-2">
            {demo && (
              <span className="hidden sm:block text-[11px] border rounded px-2 py-1 text-muted-foreground">
                Demo workspace
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh workspace"
              disabled={refreshing}
              onClick={refresh}
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                resolvedTheme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
            <NavLink
              to={base + "/profile"}
              aria-label="View your profile"
              className="size-8 rounded-full bg-accent text-primary flex items-center justify-center text-xs font-semibold"
            >
              {user?.name[0]}
            </NavLink>
          </div>
        </header>
        <main
          id="main-content"
          className="p-4 sm:p-8 max-w-[1440px] mx-auto min-w-0"
        >
          <Outlet />
        </main>
        <footer className="px-4 sm:px-8 py-5 flex flex-wrap gap-2 justify-between text-[11px] text-muted-foreground">
          <span>Student Hub · Academic workspace</span>
          <span>Clearer days. Better learning.</span>
        </footer>
      </div>
    </div>
  );
}
