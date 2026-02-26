import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components
import { AppLayout } from "@/components/layout";

// Pages
import Dashboard from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import StudentsPage from "@/pages/students";
import TeachersPage from "@/pages/teachers";
import CoursesPage from "@/pages/courses";
import FeesPage from "@/pages/fees";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/leads" component={LeadsPage}/>
        <Route path="/students" component={StudentsPage}/>
        <Route path="/teachers" component={TeachersPage}/>
        <Route path="/courses" component={CoursesPage}/>
        <Route path="/fees" component={FeesPage}/>
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
