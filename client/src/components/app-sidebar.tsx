import { useEffect, useState } from "react";
import { Home, Users, Briefcase, User, Award, ShoppingBag, LogOut, MessageCircle, Settings, HelpCircle, FileText, Shield, ChevronUp, Search, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, clearSession, getCachedUser } from "@/lib/api";

const menuItems = [
  { title: "Home",            url: "/home",        icon: Home },
  { title: "Search People",   url: "/search",      icon: Search },
  { title: "Referral Center", url: "/referrals",   icon: Briefcase, notif: true },
  { title: "Connections",     url: "/connections", icon: Users,     connReq: true },
  { title: "Messages",        url: "/messages",    icon: MessageCircle },
  { title: "Marketplace",     url: "/marketplace", icon: ShoppingBag },
  { title: "Profile",         url: "/profile",     icon: User },
];

export function AppSidebar({ onLogout }: { onLogout?: () => void }) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(getCachedUser() || {});
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [connReqCount, setConnReqCount] = useState(0);

  useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  // Poll for referral-related unread notifications
  useEffect(() => {
    const load = () =>
      fetch("/api/notifications", { headers: { Authorization: `Bearer ${localStorage.getItem("chakri_token") || ""}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const unread = data.filter(n => !n.read && ["referral_accepted", "referral_confirmed"].includes(n.type)).length;
          setUnreadNotifCount(unread);
        }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Poll for pending connection requests
  useEffect(() => {
    const load = () =>
      fetch("/api/users/connect-requests", { headers: { Authorization: `Bearer ${localStorage.getItem("chakri_token") || ""}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => setConnReqCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { clearSession(); onLogout?.(); setLocation("/"); };
  const initials = (user?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      {/* Logo */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <span className="text-white font-bold text-base">C</span>
          </div>
          <span className="font-bold text-xl text-sidebar-foreground tracking-tight">Chakri</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {menuItems.map(item => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                          ${isActive
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }`}>
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : ""}`} />
                        <span className="flex-1">{item.title}</span>
                        {item.notif && unreadNotifCount > 0 && (
                          <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                            {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                          </span>
                        )}
                        {item.connReq && connReqCount > 0 && (
                          <span className="h-5 min-w-5 px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                            {connReqCount > 9 ? "9+" : connReqCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-sidebar-accent transition-colors text-left group">
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-violet-500/30">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name || "Your Name"}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Award className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-sidebar-foreground/50">{(user?.points || 0).toLocaleString()} coins</span>
                </div>
              </div>
              <ChevronUp className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <DropdownMenuItem asChild><Link href="/profile"   className="flex items-center gap-2 cursor-pointer"><User className="h-4 w-4" />View Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings"  className="flex items-center gap-2 cursor-pointer"><Settings className="h-4 w-4" />Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/contact"   className="flex items-center gap-2 cursor-pointer"><HelpCircle className="h-4 w-4" />Contact Us</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/terms"     className="flex items-center gap-2 cursor-pointer"><FileText className="h-4 w-4" />Terms of Service</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/privacy"   className="flex items-center gap-2 cursor-pointer"><Shield className="h-4 w-4" />Privacy Policy</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"><LogOut className="h-4 w-4" />Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
