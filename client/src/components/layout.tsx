import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard, Users, UserSquare2, BookOpen, CreditCard, GraduationCap,
  Bell, X, Menu, ClipboardList, FileText, Package, TrendingUp, MessageSquare,
  IdCard, BarChart3, GitBranch, ShieldCheck, LogOut, KeyRound, ChevronDown, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth";
import { useBranch } from "@/contexts/branch";
import { ChangePasswordDialog } from "@/components/password-dialogs";
import type { Notification, Branch } from "@shared/schema";
import { useEffect } from "react";

// module: undefined = always visible (admin items, dashboard)
const navigation = [
  { group: "Overview", items: [
    { name: "Dashboard",        href: "/",              icon: LayoutDashboard, module: undefined },
  ]},
  { group: "People", items: [
    { name: "Enquiries",        href: "/leads",         icon: UserSquare2,     module: "leads" },
    { name: "Students",         href: "/students",      icon: Users,           module: "students" },
    { name: "Teachers",         href: "/teachers",      icon: GraduationCap,   module: "teachers" },
  ]},
  { group: "Academics", items: [
    { name: "Courses & Batches",href: "/courses",       icon: BookOpen,        module: "courses" },
    { name: "Assignments",      href: "/assignments",   icon: ClipboardList,   module: "assignments" },
    { name: "Exams",            href: "/exams",         icon: FileText,        module: "exams" },
  ]},
  { group: "Finance", items: [
    { name: "Fees & Payments",  href: "/fees",          icon: CreditCard,      module: "fees" },
    { name: "Income / Expense", href: "/transactions",  icon: TrendingUp,      module: "transactions" },
  ]},
  { group: "Operations", items: [
    { name: "Inventory",        href: "/inventory",     icon: Package,         module: "inventory",       adminOnly: false },
    { name: "Communications",   href: "/communications",icon: MessageSquare,   module: "communications",  adminOnly: false },
    { name: "ID Cards",         href: "/idcards",       icon: IdCard,          module: undefined,         adminOnly: true },
    { name: "Reports",          href: "/reports",       icon: BarChart3,       module: "reports",         adminOnly: false },
  ]},
  { group: "Administration", items: [
    { name: "Branches",         href: "/branches",      icon: GitBranch,       module: undefined,         adminOnly: true },
    { name: "Users & Roles",    href: "/users",         icon: ShieldCheck,     module: undefined,         adminOnly: true },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout, canAccess } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "AD";
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(220 25% 12%)' }}>
      {/* Logo Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid hsl(220 22% 20%)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="BADAM SINGH Classes" className="h-9 w-auto object-contain flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight truncate" style={{ color: 'hsl(210 30% 92%)' }}>BADAM SINGH</p>
            <p className="text-[10px] leading-tight truncate" style={{ color: 'hsl(210 20% 65%)' }}>Classes</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: 'hsl(210 20% 65%)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'hsl(220 22% 20%)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: 'none' }}>
        {navigation.map((section) => {
          const visibleItems = section.items.filter(item => {
            if ((item as any).adminOnly) return isAdmin;
            if (!item.module) return true;
            return isAdmin || canAccess(item.module);
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.group} className="mb-1">
              {/* Group label */}
              <p className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'hsl(210 20% 45%)' }}>
                {section.group}
              </p>
              {visibleItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    style={isActive ? {
                      backgroundColor: 'hsl(180 78% 29%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 12px hsl(180 78% 29% / 40%)',
                    } : {
                      color: 'hsl(210 25% 78%)',
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 text-sm font-medium group ${
                      isActive ? "" : "hover:bg-white/8"
                    }`}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'hsl(220 22% 20%)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <item.icon
                      style={{ width: '17px', height: '17px', flexShrink: 0, color: isActive ? '#fff' : 'hsl(210 25% 62%)' }}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-2 py-2" style={{ borderTop: '1px solid hsl(220 22% 20%)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
            style={{ backgroundColor: 'hsl(180 78% 25%)', color: 'hsl(180 78% 80%)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'hsl(210 30% 92%)' }}>{user?.name ?? "Admin"}</p>
            <p className="text-[11px] truncate leading-tight capitalize" style={{ color: 'hsl(210 20% 55%)' }}>{user?.role ?? "staff"}</p>
          </div>
        </div>
        <button
          onClick={() => setChangePasswordOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'hsl(210 25% 65%)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(220 22% 20%)'; e.currentTarget.style.color = 'hsl(210 30% 88%)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'hsl(210 25% 65%)'; }}
          data-testid="button-sidebar-change-password"
        >
          <KeyRound style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>Reset Password</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'hsl(0 60% 65%)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(0 60% 15%)'; e.currentTarget.style.color = 'hsl(0 80% 75%)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'hsl(0 60% 65%)'; }}
          data-testid="button-logout"
        >
          <LogOut style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
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

function UserDropdown() {
  const { user, logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-accent/60 transition-colors cursor-pointer group"
            data-testid="button-user-menu"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-foreground leading-tight">{user?.name ?? "Admin"}</span>
              <span className="text-[11px] text-muted-foreground capitalize">{user?.role ?? "staff"}</span>
            </div>
            <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.email}</p>
          </div>
          <DropdownMenuItem
            className="gap-2 cursor-pointer rounded-lg mx-1 my-1"
            onClick={() => setChangePasswordOpen(true)}
            data-testid="menu-item-change-password"
          >
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-destructive focus:text-destructive rounded-lg mx-1 mb-1"
            onClick={logout}
            data-testid="menu-item-signout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </>
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
            <UserDropdown />
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
