import { useEffect, useState } from "react";
import { api, getCachedUser } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Briefcase, Users, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const [feed, setFeed] = useState<any[]>([]);
  const [user, setUser] = useState<any>(getCachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.feed.list(), api.auth.me()]).then(([f, u]) => {
      setFeed(f); setUser(u);
    }).finally(() => setLoading(false));
  }, []);

  const icon = (type: string) => {
    if (type === "referral_completed") return <Briefcase className="h-4 w-4 text-green-500" />;
    if (type === "new_member") return <Users className="h-4 w-4 text-blue-500" />;
    if (type === "milestone") return <Award className="h-4 w-4 text-yellow-500" />;
    return <Zap className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {(user?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{user?.name || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">{user?.headline || "Add your headline"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">{(user?.points || 0).toLocaleString()} Coins</p>
                  <p className="text-xs text-muted-foreground">Your balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center — feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Community Activity</h2>
          {loading && <p className="text-muted-foreground text-sm">Loading feed...</p>}
          {!loading && feed.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No activity yet</p>
              <p className="text-sm mt-1">Activity appears here as the community uses Chakri</p>
            </CardContent></Card>
          )}
          {feed.map(item => (
            <Card key={item.id} className="hover:shadow-sm transition-all">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-0.5">{icon(item.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
