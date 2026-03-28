import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Briefcase, UserPlus, CheckCircle, Star, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

const iconMap: Record<string, any> = {
  referral_accepted:   Briefcase,
  referral_confirmed:  CheckCircle,
  referral_completed:  CheckCircle,
  connection_request:  UserPlus,
  recommendation:      Star,
};

const colorMap: Record<string, string> = {
  referral_accepted:   "text-green-500",
  referral_confirmed:  "text-blue-500",
  referral_completed:  "text-purple-500",
  connection_request:  "text-orange-500",
  recommendation:      "text-yellow-500",
};

export default function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    api.notifications.list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // Mark all as read when page opens
    api.notifications.markRead().catch(() => {});
  }, []);

  const unread = items.filter(n => !n.read).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unread > 0 && <Badge className="bg-red-500 text-white">{unread} new</Badge>}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!loading && items.length === 0 && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">No notifications yet</p>
          <p className="text-sm mt-2">You'll be notified when someone accepts your referral request or connects with you.</p>
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {items.map(n => {
          const Icon = iconMap[n.type] || Zap;
          const color = colorMap[n.type] || "text-primary";
          return (
            <Card
              key={n.id}
              className={`cursor-pointer hover:shadow-md transition-all ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
              onClick={() => { if (n.linkUrl) setLocation(n.linkUrl); }}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`mt-0.5 shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
