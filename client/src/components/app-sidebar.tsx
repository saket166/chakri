import { useEffect, useState } from "react";
import { Home, Users, Briefcase, User, Award, ShoppingBag, LogOut, MessageCircle, Settings, HelpCircle, FileText, Shield, ChevronUp, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfile, logout, getUnreadDMCount } from "@/lib/userStore";

const menuItems = [
  { title: "Home",            url: "/home",        icon: Home },
  { title: "Search People",   url: "/search",      icon: Search },
  { title: "Referral Center", url: "/referrals",   icon: Briefcase },
  { title: "Connections",     url: "/connections",  icon: Users },
  { title: "Messages",        url: "/messages",     icon: MessageCircle },
  { title: "Marketplace",     url: "/marketplace",  icon: ShoppingBag },
  { title: "Profile",         url: "/profile",      icon: User },
];

export function AppSidebar({ onLogout }: { onLogout?: () => void }) {
  const [location, setLocation] = useLocation();
  const [profile, setProfile] = useState(getProfile());
  const [unread, setUnread] = useState(getUnreadDMCount());

  useEffect(() => {
    const onProfile = () => setProfile(getProfile());
    const onDM = () => setUnread(getUnreadDMCount());
    window.addEventListener("chakri_profile_updated", onProfile);
    window.addEventListener("chakri_dm_updated", onDM);
    return () => {
      window.removeEventListener("chakri_profile_updated", onProfile);
      window.removeEventListener("chakri_dm_updated", onDM);
    };
  }, []);

  const handleLogout = () => { logout(); onLogout?.(); setLocation("/"); };

  const initials = profile.name
    ? profile.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()
    : "?";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/home" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl">Chakri</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Messages" && unread > 0 && (
                        <Badge className="h-4 px-1 text-xs bg-red-500 text-white">{unread}</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors text-left">
              <Avatar className="h-9 w-9 shrink-0">
                {profile.avatarUrl
                  ? <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.name || "Your Name"}</p>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">{(profile.points || 0).toLocaleString()} coins</span>
                </div>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/contact" className="flex items-center gap-2 cursor-pointer">
                <HelpCircle className="h-4 w-4" />Contact Us
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/terms" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />Terms of Service
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/privacy" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />Privacy Policy
              </Link>
            </DropdownMenuItem>
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
