import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PointsWidgetProps {
  totalPoints: number;
  recentEarnings?: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
}

export function PointsWidget({ totalPoints, recentEarnings = [] }: PointsWidgetProps) {
  return (
    <Card data-testid="widget-points">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Chakri Points</CardTitle>
        <Award className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-primary" data-testid="text-total-points">
          {totalPoints.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Total points earned</p>
        
        {recentEarnings.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Recent Earnings</p>
            {recentEarnings.slice(0, 3).map((earning, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
                data-testid={`earning-${index}`}
              >
                <span className="text-muted-foreground text-xs">{earning.description}</span>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{earning.amount}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
