import { ConnectionCard } from "../connection-card";
import avatarUrl from "@assets/generated_images/Professional_man_avatar_f59c5afe.png";

export default function ConnectionCardExample() {
  return (
    <div className="p-4 max-w-xs">
      <ConnectionCard
        id="1"
        name="Michael Chen"
        avatar={avatarUrl}
        headline="Senior Product Manager at Google"
        company="Google"
        mutualConnections={12}
      />
    </div>
  );
}
