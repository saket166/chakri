import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";
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
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import NotificationsPage from "@/pages/notifications";
import { useState, useEffect } from "react";
import { isLoggedIn } from "@/lib/api";

function AppLayout() {
  const [location] = useLocation();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [unreadCount, setUnreadCount] = useState(0);
  (window as any).__setAppLoggedIn = setLoggedIn;

  // Poll for total unread notifications to badge the bell
  useEffect(() => {
    if (!loggedIn) return;
    const load = () => {
      const tok = localStorage.getItem("chakri_token") || "";
      if (!tok) return;
      fetch("/api/notifications", { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          if (!Array.isArray(data)) return;
          setUnreadCount(data.filter(n => !n.read).length);
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [loggedIn]);

  if (!loggedIn || location === "/") {
    if (location === "/forgot-password") return <ForgotPassword />;
    if (location === "/reset-password") return <ResetPassword />;
    return <Landing onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar onLogout={() => setLoggedIn(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0 backdrop-blur-sm bg-background/95 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <a href="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </a>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/home"           component={Home} />
              <Route path="/profile"        component={Profile} />
              <Route path="/referrals"      component={Referrals} />
              <Route path="/connections"    component={Connections} />
              <Route path="/marketplace"    component={Marketplace} />
              <Route path="/messages"       component={Messages} />
              <Route path="/settings"       component={SettingsPage} />
              <Route path="/search"         component={SearchPage} />
              <Route path="/notifications"  component={NotificationsPage} />
              <Route path="/terms"          component={Terms} />
              <Route path="/privacy"        component={Privacy} />
              <Route path="/contact"        component={Contact} />
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
