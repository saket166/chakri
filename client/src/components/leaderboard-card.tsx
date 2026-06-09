import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";
import { api } from "@/lib/api";
import { Link } from "wouter";

export function LeaderboardCard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.users.leaderboard()
      .then(setLeaders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || leaders.length === 0) return null;

  return (
    <Card className="bg-gradient-to-b from-primary/5 to-background border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top Referrers This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaders.map((user, index) => {
          const initials = (user.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={user.userId} className="flex items-center justify-between">
              <Link href={`/profile/${user.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-background shadow-sm">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                  </Avatar>
                  {index === 0 && <div className="absolute -top-1 -right-1 bg-yellow-100 rounded-full p-0.5"><Medal className="h-3 w-3 text-yellow-600" /></div>}
                  {index === 1 && <div className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-0.5"><Medal className="h-3 w-3 text-gray-500" /></div>}
                  {index === 2 && <div className="absolute -top-1 -right-1 bg-orange-100 rounded-full p-0.5"><Medal className="h-3 w-3 text-orange-700" /></div>}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">{user.company || "Chakri Member"}</p>
                </div>
              </Link>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-primary">{user.referralsCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Referrals</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
