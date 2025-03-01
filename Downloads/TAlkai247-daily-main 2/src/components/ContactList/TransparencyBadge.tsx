import { Badge } from "@/components/ui/badge";
import { TransparencyLevel } from '@/types/contact';

interface TransparencyBadgeProps {
  level: TransparencyLevel;
}

export function TransparencyBadge({ level }: TransparencyBadgeProps) {
const variant = 
  level === 'full'
    ? 'default'
    : level === 'partial'
    ? 'secondary'
    : 'destructive';

  return (
    <Badge variant={variant}>
      {level}
    </Badge>
  );
}
