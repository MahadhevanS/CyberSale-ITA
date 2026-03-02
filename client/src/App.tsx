import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Auction from "@/pages/auction";
import Defense from "@/pages/defense";
import Admin from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/auction">
        <ProtectedRoute>
          <Layout>
            <Auction />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/defense">
        <ProtectedRoute>
          <Layout>
            <Defense />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <Layout>
            <Admin />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
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
