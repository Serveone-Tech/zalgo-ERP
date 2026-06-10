import { useLocation, Link } from "wouter";
import { LayoutDashboard, Video, ClipboardList, CalendarCheck, CreditCard, LogOut, GraduationCap, MonitorCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/live-classes", label: "Live Classes", icon: Video },
  { href: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/student/exams", label: "Exams", icon: ClipboardList },
  { href: "/student/online-exams", label: "Online Exams", icon: MonitorCheck },
  { href: "/student/fees", label: "Fees", icon: CreditCard },
];

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">Student Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-6 md:pl-64">{children}</main>

      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border pt-16">
        <div className="px-4 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50">Student</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/student" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40 flex">
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/student" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <a className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

