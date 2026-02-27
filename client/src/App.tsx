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
          <Route path="/leads" component={LeadsPage} />
          <Route path="/students" component={StudentsPage} />
          <Route path="/teachers" component={TeachersPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/fees" component={FeesPage} />
          <Route path="/assignments" component={AssignmentsPage} />
          <Route path="/exams" component={ExamsPage} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/transactions" component={TransactionsPage} />
          <Route path="/communications" component={CommunicationsPage} />
          <Route path="/idcards" component={IDCardsPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/branches" component={BranchesPage} />
          <Route path="/users" component={UsersPage} />
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
