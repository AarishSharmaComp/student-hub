import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  Users, UserPlus, Search, ClipboardList, GraduationCap, FileText, Download,
  BarChart3, Save, LogOut, Trophy, BookOpen, UserCheck, Menu, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: BarChart3, end: true },
  { label: 'Add Student', path: '/admin/add', icon: UserPlus },
  { label: 'View Students', path: '/admin/students', icon: Users },
  { label: 'Search Student', path: '/admin/search', icon: Search },
  { label: 'Attendance', path: '/admin/attendance', icon: ClipboardList },
  { label: 'Grades', path: '/admin/grades', icon: GraduationCap },
  { label: 'Reports', path: '/admin/reports', icon: FileText },
  { label: 'Export CSV', path: '/admin/export', icon: Download },
  { label: 'Statistics', path: '/admin/statistics', icon: BarChart3 },
  { label: 'Ranking', path: '/admin/ranking', icon: Trophy },
  { label: 'Course Topper', path: '/admin/toppers', icon: GraduationCap },
  { label: 'Course Strength', path: '/admin/strength', icon: BookOpen },
  { label: 'Attendance Report', path: '/admin/attendance-report', icon: UserCheck },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-border flex flex-col shrink-0 bg-card transition-all duration-300 fixed inset-y-0 left-0 z-30",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-full flex items-center justify-center">
              <span className="font-serif text-xl text-primary-foreground">S</span>
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight">Acadia</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                isActive
                  ? "text-primary font-medium bg-accent border-r-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="size-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xs font-medium">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Administrator</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="size-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "ml-64" : "ml-0")}>
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-6 flex items-center sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4">
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </header>
        <main className="flex-1 p-6 md:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
