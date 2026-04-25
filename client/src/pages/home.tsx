import { useEffect, useState } from "react";
import { api, getCachedUser } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Briefcase, Users, Zap, Building2, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Home() {
  const [feed, setFeed] = useState<any[]>([]);
  const [user, setUser] = useState<any>(getCachedUser());
  const [companyStats, setCompanyStats] = useState<{ company: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.feed.list(),
      api.auth.me(),
      api.users.companyStats(),
    ]).then(([f, u, cs]) => {
      setFeed(f);
      setUser(u);
      setCompanyStats(cs);
    }).finally(() => setLoading(false));
  }, []);

  const feedIcon = (type: string) => {
    if (type === "referral_completed") return (
      <div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
        <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
    );
    if (type === "new_member") return (
      <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
    );
    if (type === "milestone") return (
      <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
        <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
    return (
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="h-4 w-4 text-primary" />
      </div>
    );
  };

  const firstName = (user?.name || "there").split(" ")[0];
  const initials = (user?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">

      {/* ── Welcome strip ── */}
      <div className="flex items-center gap-3 mb-7 px-1">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center shrink-0 shadow-md">
          <span className="text-sm font-black text-primary-foreground">{initials}</span>
        </div>
        <div>
          <p className="font-bold text-base leading-tight">Welcome back, {firstName} 👋</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.headline || "Complete your profile to get started"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* ── Premium Coins Widget ── */}
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-rose-500 to-rose-700" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(255,255,255,0.1) 0%, transparent 40%)"
            }} />
            <div className="relative p-5 text-white">
              <div className="flex items-start justify-between mb-5">
                <div className="min-w-0">
                  <p className="font-bold truncate leading-tight">{user?.name || "Your Name"}</p>
                  <p className="text-xs text-white/70 truncate mt-0.5">{user?.headline || "Add your headline"}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
                  <span className="text-xs font-black text-white">{initials}</span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-black leading-none">{(user?.points || 0).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Award className="h-3.5 w-3.5 text-yellow-300" />
                  <p className="text-xs text-white/80 font-medium">Chakri Coins</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Companies on Chakri ── */}
          <Card className="shadow-sm hover-lift-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Companies on Chakri
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-6 rounded-full shimmer" />)}
                </div>
              )}
              {!loading && companyStats.length === 0 && (
                <p className="text-xs text-muted-foreground">No companies yet.</p>
              )}
              {!loading && companyStats.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {companyStats.map(({ company, count }) => (
                    <div
                      key={company}
                      className="flex items-center gap-1.5 bg-muted/80 hover:bg-muted border border-border/40 rounded-full px-2.5 py-1 transition-colors cursor-default"
                    >
                      <span className="text-xs font-medium">{company}</span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ── Center — Activity Feed ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Community Activity</h2>
            </div>
            {feed.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{feed.length} events</span>
            )}
          </div>

          {/* Shimmer skeleton loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl shimmer shrink-0" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 shimmer rounded-full w-3/4" />
                      <div className="h-2.5 shimmer rounded-full w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && feed.length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-semibold">No activity yet</p>
                <p className="text-sm mt-1.5 max-w-xs mx-auto text-muted-foreground">
                  Activity appears here as the community starts using Chakri.
                </p>
                <Link href="/search" className="mt-4 inline-block text-xs text-primary hover:underline font-medium">
                  Find People to Connect →
                </Link>
              </CardContent>
            </Card>
          )}

          {feed.map(item => (
            <Card key={item.id} className="shadow-sm hover-lift-sm cursor-default">
              <CardContent className="p-4 flex items-start gap-3">
                {feedIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
