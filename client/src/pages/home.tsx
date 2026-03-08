import { useState, useEffect } from "react";
import { getProfile, getFeed, getRequests, type FeedItem } from "@/lib/userStore";
import { PointsWidget } from "@/components/points-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Briefcase, Award, Newspaper, Bell, Building2, Star, Zap, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

const feedIcons: Record<FeedItem["type"], JSX.Element> = {
  referral_accepted:  <Briefcase className="h-4 w-4 text-blue-500" />,
  referral_completed: <Star className="h-4 w-4 text-green-500" />,
  new_member:         <Users className="h-4 w-4 text-purple-500" />,
  company_news:       <Building2 className="h-4 w-4 text-orange-500" />,
  milestone:          <Zap className="h-4 w-4 text-yellow-500" />,
  rating:             <Star className="h-4 w-4 text-yellow-500" />,
};

const borderColors: Record<FeedItem["type"], string> = {
  referral_accepted:  "#3b82f6",
  referral_completed: "#22c55e",
  new_member:         "#a855f7",
  company_news:       "#f97316",
  milestone:          "#eab308",
  rating:             "#eab308",
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState(getProfile());
  const [feed, setFeed] = useState<FeedItem[]>(getFeed());
  const openRequests = getRequests().filter(r => r.status === "open").length;

  useEffect(() => {
    const onProfile = () => setProfile(getProfile());
    const onFeed = () => setFeed(getFeed());
    window.addEventListener("chakri_profile_updated", onProfile);
    window.addEventListener("chakri_feed_updated", onFeed);
    return () => {
      window.removeEventListener("chakri_profile_updated", onProfile);
      window.removeEventListener("chakri_feed_updated", onFeed);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Left sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <PointsWidget totalPoints={profile.points} recentEarnings={[]} />
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Connections", value: String((profile.permanentConnections || []).length) },
                { label: "Open Requests", value: String(openRequests) },
                { label: "Strikes", value: String(profile.strikes || 0), warn: (profile.strikes || 0) > 0 },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={"font-semibold " + (s.warn ? "text-destructive" : "")}>{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button className="w-full" onClick={() => setLocation("/referrals")}>
            <Plus className="h-4 w-4 mr-2" />Ask for Referral
          </Button>
        </aside>

        {/* Main feed */}
        <main className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Community Feed</h2>
            {feed.length > 0 && <Badge variant="secondary" className="ml-auto text-xs">{feed.length} updates</Badge>}
          </div>

          {feed.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-lg">Feed is empty</p>
                <p className="text-sm mt-2">Activity from you and your community will appear here.</p>
                <p className="text-sm">Start by posting a referral request!</p>
                <Button className="mt-4" onClick={() => setLocation("/referrals")}>
                  <Plus className="h-4 w-4 mr-2" />Post a Request
                </Button>
              </CardContent>
            </Card>
          ) : feed.map(item => (
            <Card key={item.id} className="border-l-4 transition-all hover:shadow-sm"
              style={{ borderLeftColor: borderColors[item.type] }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-background border flex items-center justify-center shrink-0 mt-0.5">
                    {feedIcons[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </main>

        {/* Right sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {[
                ["Post a referral request", "spend coins"],
                ["Someone at that company accepts", "connection opens"],
                ["They refer you within 24h", "they earn coins"],
                ["You confirm the referral", "both get rated"],
                ["3 missed deadlines = ban", "1 week"],
              ].map(([action, result]) => (
                <div key={action} className="flex justify-between gap-2">
                  <span>{action}</span>
                  <span className="font-medium text-primary shrink-0">{result}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />Coin Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {[
                ["Complete a referral", "+1.5× request cost"],
                ["Hire confirmed", "+2000 coins"],
                ["Sign up bonus", "+500 coins"],
                ["Miss 24hr window", "−1 Strike"],
              ].map(([action, reward]) => (
                <div key={action} className="flex justify-between">
                  <span>{action}</span>
                  <span className={"font-medium " + (reward.startsWith("+") ? "text-green-600" : "text-destructive")}>{reward}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
