import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, ClipboardList, GraduationCap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'My Details', path: '/student', icon: User, end: true },
  { label: 'Attendance', path: '/student/attendance', icon: ClipboardList },
  { label: 'Grades', path: '/student/grades', icon: GraduationCap },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border flex flex-col shrink-0 bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-full flex items-center justify-center">
              <span className="font-serif text-xl text-primary-foreground">S</span>
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight">Acadia</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
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
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="size-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
