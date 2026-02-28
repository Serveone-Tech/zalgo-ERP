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
import Dashboard from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import StudentsPage from "@/pages/students";
import TeachersPage from "@/pages/teachers";
import CoursesPage from "@/pages/courses";
import FeesPage from "@/pages/fees";
import AssignmentsPage from "@/pages/assignments";
import ExamsPage from "@/pages/exams";
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

function AccessDenied() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-sm mt-1">You do not have permission to view this page.</p>
        <p className="text-muted-foreground text-xs mt-1">Contact your administrator to request access.</p>
      </div>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

function ProtectedRoute({ module, adminOnly, component: Component }: {
  module?: string;
  adminOnly?: boolean;
  component: React.ComponentType;
}) {
  const { user, canAccess } = useAuth();
  if (!user) return null;

  if (adminOnly && user.role !== "admin") return <AccessDenied />;
  if (module && user.role !== "admin" && !canAccess(module)) return <AccessDenied />;

  return <Component />;
}

function AuthenticatedRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <BranchProvider>
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/leads">{() => <ProtectedRoute module="leads" component={LeadsPage} />}</Route>
          <Route path="/leads/:id">{() => <ProtectedRoute module="leads" component={LeadViewPage} />}</Route>
          <Route path="/students">{() => <ProtectedRoute module="students" component={StudentsPage} />}</Route>
          <Route path="/students/:id">{() => <ProtectedRoute module="students" component={StudentViewPage} />}</Route>
          <Route path="/teachers">{() => <ProtectedRoute module="teachers" component={TeachersPage} />}</Route>
          <Route path="/teachers/:id">{() => <ProtectedRoute module="teachers" component={TeacherViewPage} />}</Route>
          <Route path="/courses">{() => <ProtectedRoute module="courses" component={CoursesPage} />}</Route>
          <Route path="/courses/:id">{() => <ProtectedRoute module="courses" component={CourseViewPage} />}</Route>
          <Route path="/fees">{() => <ProtectedRoute module="fees" component={FeesPage} />}</Route>
          <Route path="/assignments">{() => <ProtectedRoute module="assignments" component={AssignmentsPage} />}</Route>
          <Route path="/exams">{() => <ProtectedRoute module="exams" component={ExamsPage} />}</Route>
          <Route path="/inventory">{() => <ProtectedRoute module="inventory" component={InventoryPage} />}</Route>
          <Route path="/transactions">{() => <ProtectedRoute module="transactions" component={TransactionsPage} />}</Route>
          <Route path="/communications">{() => <ProtectedRoute module="communications" component={CommunicationsPage} />}</Route>
          <Route path="/reports">{() => <ProtectedRoute module="reports" component={ReportsPage} />}</Route>
          <Route path="/idcards">{() => <ProtectedRoute adminOnly component={IDCardsPage} />}</Route>
          <Route path="/branches">{() => <ProtectedRoute adminOnly component={BranchesPage} />}</Route>
          <Route path="/users">{() => <ProtectedRoute adminOnly component={UsersPage} />}</Route>
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
