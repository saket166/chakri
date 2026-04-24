import { useState, useEffect } from "react";
import { Bell, CheckCheck, Briefcase, Users, Award, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

async function fetchNotifications() {
  const tok = localStorage.getItem("chakri_token") || "";
  const r = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${tok}` } });
  return r.ok ? r.json() : [];
}

async function markAllRead() {
  const tok = localStorage.getItem("chakri_token") || "";
  await fetch("/api/notifications/mark-read", { method: "POST", headers: { Authorization: `Bearer ${tok}` } });
}

const notifIcon = (type: string) => {
  if (type === "referral_accepted" || type === "referral_confirmed")
    return <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0"><Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" /></div>;
  if (type === "connection_request")
    return <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>;
  if (type === "milestone")
    return <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0"><Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /></div>;
  return <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Zap className="h-4 w-4 text-primary" /></div>;
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetchNotifications().then(setNotifs).finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount} new</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />Mark all read
          </Button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4 flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {!loading && notifs.length === 0 && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You'll see referral updates and connection requests here</p>
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {notifs.map(n => (
          <Card
            key={n.id}
            className={`transition-all cursor-pointer hover:shadow-sm ${!n.read ? "border-primary/30 bg-primary/[0.02]" : ""}`}
            onClick={() => { if (n.linkUrl) setLocation(n.linkUrl); }}
          >
            <CardContent className="p-4 flex items-start gap-3">
              {notifIcon(n.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-snug ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
