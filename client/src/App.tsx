import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { JobsTicker } from "@/components/jobs-ticker";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Referrals from "@/pages/referrals";
import Connections from "@/pages/connections";
import Marketplace from "@/pages/marketplace";
import Messages from "@/pages/messages";
import SettingsPage from "@/pages/settings";
import SearchPage from "@/pages/search";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { isLoggedIn } from "@/lib/api";

function AppLayout() {
  const [location] = useLocation();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  (window as any).__setAppLoggedIn = setLoggedIn;

  if (!loggedIn || location === "/") {
    return <Landing onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar onLogout={() => setLoggedIn(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b shrink-0">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/home"        component={Home} />
              <Route path="/profile"     component={Profile} />
              <Route path="/referrals"   component={Referrals} />
              <Route path="/connections" component={Connections} />
              <Route path="/marketplace" component={Marketplace} />
              <Route path="/messages"    component={Messages} />
              <Route path="/settings"    component={SettingsPage} />
              <Route path="/search"      component={SearchPage} />
              <Route path="/terms"       component={Terms} />
              <Route path="/privacy"     component={Privacy} />
              <Route path="/contact"     component={Contact} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <JobsTicker />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
