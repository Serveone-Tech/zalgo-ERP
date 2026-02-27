import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard, Users, UserSquare2, BookOpen, CreditCard, GraduationCap,
  Bell, X, Menu, ClipboardList, FileText, Package, TrendingUp, MessageSquare,
  IdCard, BarChart3, GitBranch, ShieldCheck, LogOut, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth";
import { useBranch } from "@/contexts/branch";
import type { Notification, Branch } from "@shared/schema";
import { useEffect } from "react";

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
  { group: "Administration", items: [
    { name: "Branches", href: "/branches", icon: GitBranch },
    { name: "Users & Roles", href: "/users", icon: ShieldCheck },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  return (
    <div className="flex flex-col h-full">
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

      <div className="px-5 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider font-semibold">Institute</p>
        <p className="text-sm font-semibold text-sidebar-foreground mt-0.5">BADAM SINGH Classes</p>
      </div>

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
                  <item.icon className={`flex-shrink-0 ${isActive ? "text-white" : "text-sidebar-foreground/50"}`} style={{ width: '18px', height: '18px' }} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name ?? "Admin"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{user?.role ?? "staff"}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });
  const unread = notifications.filter(n => !n.isRead).length;

  const markAllMut = useMutation({
    mutationFn: () => fetch("/api/notifications/read-all", { method: "PUT", credentials: "include" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markOneMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/notifications/${id}/read`, { method: "PUT", credentials: "include" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const typeColor: Record<string, string> = {
    info: "text-blue-600 bg-blue-50 border-blue-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    danger: "text-red-600 bg-red-50 border-red-200",
    success: "text-green-600 bg-green-50 border-green-200",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-full h-9 w-9" data-testid="button-notifications">
          <Bell style={{ width: '18px', height: '18px' }} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center border border-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => markAllMut.mutate()}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No notifications</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                onClick={() => !n.isRead && markOneMut.mutate(n.id)}
              >
                <div className="flex gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    n.type === "warning" ? "bg-yellow-400" :
                    n.type === "danger" ? "bg-red-500" :
                    n.type === "success" ? "bg-green-500" : "bg-blue-400"
                  }`} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BranchSelector() {
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  if (branches.length === 0) return null;

  return (
    <Select value={selectedBranchId ? String(selectedBranchId) : "all"} onValueChange={v => setSelectedBranchId(v === "all" ? null : Number(v))}>
      <SelectTrigger className="h-8 text-xs border-border/60 bg-background/50 w-36 md:w-44 gap-1" data-testid="select-branch-filter">
        <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
        <SelectValue placeholder="All Branches" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Branches</SelectItem>
        {branches.map(b => (
          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => { setMobileSidebarOpen(false); }, [location]);

  useEffect(() => {
    if (mobileSidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  const currentPage = navigation.flatMap(s => s.items).find(item => item.href === location)?.name || "Dashboard";
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-white/90 backdrop-blur-md px-4 md:px-6 shadow-sm">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-foreground/70 hover:text-foreground hover:bg-accent transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate hidden sm:block">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <BranchSelector />
            <NotificationBell />
            <div className="h-7 w-[1px] bg-border/50 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-foreground leading-tight">{user?.name ?? "Admin"}</span>
                <span className="text-[11px] text-muted-foreground capitalize">{user?.role ?? "staff"}</span>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
