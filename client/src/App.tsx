import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";

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

function Router() {
  return (
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
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
