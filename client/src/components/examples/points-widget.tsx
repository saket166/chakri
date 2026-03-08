import { PointsWidget } from "../points-widget";

export default function PointsWidgetExample() {
  return (
    <div className="p-4 max-w-sm">
      <PointsWidget
        totalPoints={2500}
        recentEarnings={[
          { amount: 500, description: "Referral confirmed", date: "2 days ago" },
          { amount: 500, description: "Referral confirmed", date: "5 days ago" },
        ]}
      />
    </div>
  );
}
