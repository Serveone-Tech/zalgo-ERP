// client/src/App.tsx — REPLACE
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { BranchProvider } from "@/contexts/branch";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import { Loader2 } from "lucide-react";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import OnboardingPage from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import StudentsPage from "@/pages/students";
import TeachersPage from "@/pages/teachers";
import CoursesPage from "@/pages/courses";
import FeesPage from "@/pages/fees";
import InventoryPage from "@/pages/inventory";
import TransactionsPage from "@/pages/transactions";
import CommunicationsPage from "@/pages/communications";
import IDCardsPage from "@/pages/idcards";
import ReportsPage from "@/pages/reports";
import BranchesPage from "@/pages/branches";
import UsersPage from "@/pages/users";
import StudentViewPage from "@/pages/student-view";
import TeacherViewPage from "@/pages/teacher-view";
import LeadViewPage from "@/pages/lead-view";
import CourseViewPage from "@/pages/course-view";
import BackupsPage from "@/pages/backups";
import NotificationsPage from "./pages/notifications-page";
import ReportCard from "./pages/report-card";
import PricingPage from "./pages/pricing";
import SuperAdminDashboard from "./pages/superadmin";
import AutomationPage from "./pages/automation";
import OrganizationSettingsPage from "./pages/organization-settings";

function AccessDenied() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-sm mt-1">
          You do not have permission to view this page.
        </p>
      </div>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

function ModuleBlocked({ module }: { module: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold">Module Not Available</h2>
        <p className="text-muted-foreground text-sm mt-1">
          The <span className="font-medium capitalize">{module}</span> module is
          not included in your current plan.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate("/pricing")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({
  module,
  adminOnly,
  component: Component,
}: {
  module?: string;
  adminOnly?: boolean;
  component: React.ComponentType;
}) {
  const { user, canAccess, canUseModule } = useAuth();
  if (!user) return null;
  const isPrivileged = user.role === "admin" || user.role === "superadmin";
  if (adminOnly && !isPrivileged) return <AccessDenied />;
  if (module && !isPrivileged && !canAccess(module)) return <AccessDenied />;
  if (module && user.role !== "superadmin" && !canUseModule(module))
    return <ModuleBlocked module={module} />;
  return <Component />;
}

function AuthenticatedRouter() {
  const { user, isLoading, subscription, subscriptionLoading, markOnboarded } =
    useAuth();
  const [location] = useLocation();

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  if (location === "/register") return <RegisterPage />;
  if (!user) return <LoginPage />;

  if (user.role === "superadmin") {
    return (
      <BranchProvider>
        <AppLayout>
          <Switch>
            <Route path="/" component={SuperAdminDashboard} />
            <Route path="/dashboard" component={SuperAdminDashboard} />
            <Route path="/superadmin" component={SuperAdminDashboard} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </BranchProvider>
    );
  }

  if (!subscriptionLoading && subscription !== null) {
    const noSub =
      subscription.status === "none" || subscription.status === "expired";
    if (noSub && location !== "/pricing") return <PricingPage />;
  }

  if (user.isOnboarded === false && subscription?.status === "active") {
    return <OnboardingPage onComplete={markOnboarded} />;
  }

  return (
    <BranchProvider>
      <AppLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/" component={Dashboard} />
          <Route path="/leads">
            {() => <ProtectedRoute module="leads" component={LeadsPage} />}
          </Route>
          <Route path="/leads/:id">
            {() => <ProtectedRoute module="leads" component={LeadViewPage} />}
          </Route>
          <Route path="/students">
            {() => (
              <ProtectedRoute module="students" component={StudentsPage} />
            )}
          </Route>
          <Route path="/students/:id">
            {() => (
              <ProtectedRoute module="students" component={StudentViewPage} />
            )}
          </Route>
          <Route path="/teachers">
            {() => (
              <ProtectedRoute module="teachers" component={TeachersPage} />
            )}
          </Route>
          <Route path="/teachers/:id">
            {() => (
              <ProtectedRoute module="teachers" component={TeacherViewPage} />
            )}
          </Route>
          <Route path="/courses">
            {() => <ProtectedRoute module="courses" component={CoursesPage} />}
          </Route>
          <Route path="/courses/:id">
            {() => (
              <ProtectedRoute module="courses" component={CourseViewPage} />
            )}
          </Route>
          <Route path="/fees">
            {() => <ProtectedRoute module="fees" component={FeesPage} />}
          </Route>
          <Route path="/inventory">
            {() => (
              <ProtectedRoute module="inventory" component={InventoryPage} />
            )}
          </Route>
          <Route path="/transactions">
            {() => (
              <ProtectedRoute
                module="transactions"
                component={TransactionsPage}
              />
            )}
          </Route>
          <Route path="/communications">
            {() => (
              <ProtectedRoute
                module="communications"
                component={CommunicationsPage}
              />
            )}
          </Route>
          <Route path="/automation">
            {() => (
              <ProtectedRoute
                module="communications"
                component={AutomationPage}
              />
            )}
          </Route>
          <Route path="/reports">
            {() => <ProtectedRoute module="reports" component={ReportsPage} />}
          </Route>
          <Route path="/report-card">
            {() => (
              <ProtectedRoute module="report-card" component={ReportCard} />
            )}
          </Route>
          <Route path="/idcards">
            {() => <ProtectedRoute adminOnly component={IDCardsPage} />}
          </Route>
          <Route path="/branches">
            {() => <ProtectedRoute adminOnly component={BranchesPage} />}
          </Route>
          <Route path="/users">
            {() => <ProtectedRoute adminOnly component={UsersPage} />}
          </Route>
          <Route path="/backups">
            {() => <ProtectedRoute module="backups" component={BackupsPage} />}
          </Route>
          <Route path="/organization">
            {() => (
              <ProtectedRoute adminOnly component={OrganizationSettingsPage} />
            )}
          </Route>
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/pricing" component={PricingPage} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </BranchProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AuthenticatedRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
