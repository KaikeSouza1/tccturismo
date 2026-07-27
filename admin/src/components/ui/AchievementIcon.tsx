import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { HelpCircle } from "lucide-react";

interface AchievementIconProps extends LucideProps {
  name: string;
}

export function AchievementIcon({ name, ...props }: AchievementIconProps) {
  const Icon = (icons as unknown as Record<string, icons.LucideIcon>)[name] ?? HelpCircle;
  return <Icon {...props} />;
}
