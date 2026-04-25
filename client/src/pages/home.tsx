import { useEffect, useState } from "react";
import { api, getCachedUser } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Briefcase, Users, Zap, Building2 } from "lucide-react";
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
      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
        <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
    );
    if (type === "new_member") return (
      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
    );
    if (type === "milestone") return (
      <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
        <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      </div>
    );
    return (
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="h-4 w-4 text-primary" />
      </div>
    );
  };

  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">

      {/* ── Welcome strip ── */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">
            {firstName[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-base leading-tight">Welcome back, {firstName} 👋</p>
          <p className="text-xs text-muted-foreground">{user?.headline || "Complete your profile to get started"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Coins widget */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shrink-0">
                  {(user?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user?.name || "Your Name"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.headline || "Add your headline"}</p>
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20 border border-yellow-200/60 dark:border-yellow-800/30 p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{(user?.points || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Chakri Coins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companies on Chakri */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Companies on Chakri
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
              {!loading && companyStats.length === 0 && (
                <p className="text-xs text-muted-foreground">No companies yet.</p>
              )}
              {!loading && companyStats.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {companyStats.map(({ company, count }) => (
                    <div
                      key={company}
                      className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1"
                    >
                      <span className="text-xs font-medium">{company}</span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ── Center — feed ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Community Activity</h2>
            {feed.length > 0 && (
              <span className="text-xs text-muted-foreground">{feed.length} recent events</span>
            )}
          </div>
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-muted rounded animate-pulse w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading && feed.length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-14 text-center text-muted-foreground">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-7 w-7 opacity-30" />
                </div>
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1 max-w-xs mx-auto">
                  Activity appears here as the community uses Chakri.
                </p>
                <Link href="/search" className="mt-4 inline-block text-xs text-primary hover:underline">Find People →</Link>
              </CardContent>
            </Card>
          )}
          {feed.map(item => (
            <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start gap-3">
                {feedIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{item.text}</p>
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
