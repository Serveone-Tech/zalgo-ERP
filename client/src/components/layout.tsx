import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  BookOpen,
  CreditCard,
  GraduationCap,
  Bell,
  X,
  Menu,
  ClipboardList,
  FileText,
  Package,
  TrendingUp,
  MessageSquare,
  IdCard,
  BarChart3,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { group: "Overview", items: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
  ]},
  { group: "People", items: [
    { name: "Enquiries", href: "/leads", icon: UserSquare2 },
    { name: "Students", href: "/students", icon: Users },
    { name: "Teachers", href: "/teachers", icon: GraduationCap },
  ]},
  { group: "Academics", items: [
    { name: "Courses & Batches", href: "/courses", icon: BookOpen },
    { name: "Assignments", href: "/assignments", icon: ClipboardList },
    { name: "Exams", href: "/exams", icon: FileText },
  ]},
  { group: "Finance", items: [
    { name: "Fees & Payments", href: "/fees", icon: CreditCard },
    { name: "Income / Expense", href: "/transactions", icon: TrendingUp },
  ]},
  { group: "Operations", items: [
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Communications", href: "/communications", icon: MessageSquare },
    { name: "ID Cards", href: "/idcards", icon: IdCard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BADAM SINGH Classes" className="h-8 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1 rounded-lg hover:bg-sidebar-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Institute name */}
      <div className="px-5 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider font-semibold">Institute</p>
        <p className="text-sm font-semibold text-sidebar-foreground mt-0.5">BADAM SINGH Classes</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {navigation.map((section) => (
          <div key={section.group} className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-1.5">{section.group}</p>
            {section.items.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-white" : "text-sidebar-foreground/50"}`} style={{ width: '18px', height: '18px' }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Admin</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">Institute Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  const currentPage = navigation.flatMap(s => s.items).find(item => item.href === location)?.name || "Dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-white/90 backdrop-blur-md px-4 md:px-6 shadow-sm">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate hidden sm:block">{currentPage}</h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-full h-9 w-9">
              <Bell className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
            </Button>
            <div className="h-7 w-[1px] bg-border/50 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-foreground leading-tight">Admin</span>
                <span className="text-[11px] text-muted-foreground">Institute Manager</span>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
