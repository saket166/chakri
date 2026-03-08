import { Badge } from "@/components/ui/badge";
import { X, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillBadgeProps {
  skill: string;
  endorsements?: number;
  editable?: boolean;
  onRemove?: (skill: string) => void;
}

export function SkillBadge({
  skill,
  endorsements = 0,
  editable = false,
  onRemove,
}: SkillBadgeProps) {
  const handleRemove = () => {
    onRemove?.(skill);
    console.log(`Removed skill: ${skill}`);
  };

  return (
    <Badge
      variant="secondary"
      className="text-sm gap-2 pr-2"
      data-testid={`badge-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span>{skill}</span>
      {endorsements > 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="h-3 w-3" />
          {endorsements}
        </span>
      )}
      {editable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent no-default-hover-elevate"
          onClick={handleRemove}
          data-testid={`button-remove-${skill.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}
