import { SkillBadge } from "../skill-badge";

export default function SkillBadgeExample() {
  return (
    <div className="p-4 flex gap-2 flex-wrap">
      <SkillBadge skill="React" endorsements={24} />
      <SkillBadge skill="TypeScript" endorsements={18} editable />
      <SkillBadge skill="Node.js" endorsements={15} />
    </div>
  );
}
