import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import LayoutShell from "@/components/layout-shell";
import ShopPage from "@/pages/shop";
import LessonsPage from "@/pages/lessons";
import TeamPage from "@/pages/team";
import RequestsPage from "@/pages/requests";
import AdminPage from "@/pages/admin";
import RegisterPage from "@/pages/register";
import ProfilePage from "@/pages/profile";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <LayoutShell>
      <Component />
    </LayoutShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register/:token" component={RegisterPage} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/shop">
        <ProtectedRoute component={ShopPage} />
      </Route>
      <Route path="/lessons">
        <ProtectedRoute component={LessonsPage} />
      </Route>
      <Route path="/team">
        <ProtectedRoute component={TeamPage} />
      </Route>
      <Route path="/requests">
        <ProtectedRoute component={RequestsPage} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
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
