import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  BookOpen,
  CreditCard,
  GraduationCap,
  Menu,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Enquiries", href: "/leads", icon: UserSquare2 },
  { name: "Students", href: "/students", icon: Users },
  { name: "Teachers", href: "/teachers", icon: GraduationCap },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Fees & Payments", href: "/fees", icon: CreditCard },
];

function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r-0 shadow-xl bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="pt-6 pb-4 px-6 flex items-center justify-center">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30 shrink-0">
            BS
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-display font-bold text-lg leading-tight tracking-tight">Badam Singh</span>
            <span className="text-xs text-sidebar-foreground/70 font-medium">Classes ERP</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2 px-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-sidebar-foreground/60"}`} />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background/50">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 w-full">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/50 bg-white/80 backdrop-blur-md px-6 shadow-sm">
            <SidebarTrigger className="text-foreground/70 hover:text-foreground" />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground hover:bg-accent/50 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
              </Button>
              <div className="h-8 w-[1px] bg-border/50 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold text-foreground leading-tight">Admin</span>
                  <span className="text-xs text-muted-foreground">Institute Manager</span>
                </div>
                <Avatar className="h-9 w-9 border border-border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
