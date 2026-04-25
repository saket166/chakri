import { useEffect, useState } from "react";
import { Home, Users, Briefcase, User, Award, ShoppingBag, LogOut, MessageCircle, Settings, HelpCircle, FileText, Shield, ChevronUp, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, clearSession, getCachedUser } from "@/lib/api";

const menuItems = [
  { title: "Home",            url: "/home",        icon: Home },
  { title: "Search People",   url: "/search",      icon: Search },
  { title: "Referral Center", url: "/referrals",   icon: Briefcase, notif: true },
  { title: "Connections",     url: "/connections",  icon: Users, connReq: true },
  { title: "Messages",        url: "/messages",     icon: MessageCircle },
  { title: "Marketplace",     url: "/marketplace",  icon: ShoppingBag },
  { title: "Profile",         url: "/profile",      icon: User },
];

export function AppSidebar({ onLogout }: { onLogout?: () => void }) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(getCachedUser() || {});
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [connReqCount, setConnReqCount] = useState(0);

  useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  // Poll for unread referral notifications → Referral Center badge
  useEffect(() => {
    const load = () =>
      fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("chakri_token") || ""}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const referralTypes = ["referral_accepted", "referral_confirmed"];
          const unread = data.filter(n => !n.read && referralTypes.includes(n.type)).length;
          setUnreadNotifCount(unread);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Poll for pending connection requests → Connections badge
  useEffect(() => {
    const load = () =>
      fetch("/api/users/connect-requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("chakri_token") || ""}` },
      })
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
      {/* ── Brand Header ── */}
      <SidebarHeader className="p-0">
        <Link href="/home" className="flex items-center gap-3 px-4 py-4 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow shrink-0">
            <span className="text-primary-foreground font-black text-lg leading-none">C</span>
          </div>
          <div>
            <span className="font-black text-lg tracking-tight leading-none block">Chakri</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Referral Network</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 mb-1">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map(item => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.url}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-muted/80"
                          }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        <span className="flex-1">{item.title}</span>
                        {item.notif && unreadNotifCount > 0 && (
                          <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                            {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                          </span>
                        )}
                        {item.connReq && connReqCount > 0 && (
                          <span className="h-5 min-w-5 px-1 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">
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

      {/* ── Footer: User Card ── */}
      <SidebarFooter className="p-3">
        {/* Coins strip */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/60 dark:border-amber-800/30 mb-2">
          <Award className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{(user?.points || 0).toLocaleString()}</span>
          <span className="text-xs text-amber-600/70 dark:text-amber-500/70">coins</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/70 transition-colors text-left">
              <Avatar className="h-9 w-9 shrink-0">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{user?.name || "Your Name"}</p>
                <p className="text-xs text-muted-foreground truncate leading-tight">{user?.headline || user?.company || "Add your headline"}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <DropdownMenuItem asChild><Link href="/profile" className="flex items-center gap-2 cursor-pointer"><User className="h-4 w-4" />View Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings" className="flex items-center gap-2 cursor-pointer"><Settings className="h-4 w-4" />Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/contact" className="flex items-center gap-2 cursor-pointer"><HelpCircle className="h-4 w-4" />Contact Us</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/terms" className="flex items-center gap-2 cursor-pointer"><FileText className="h-4 w-4" />Terms of Service</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/privacy" className="flex items-center gap-2 cursor-pointer"><Shield className="h-4 w-4" />Privacy Policy</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer">
              <LogOut className="h-4 w-4" />Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
