import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  solvedByMe: boolean;
}

export function StatusBadge({ solvedByMe }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={
        solvedByMe
          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
      }
    >
      {solvedByMe ? "✓ Solved" : "⚠️ With Help"}
    </Badge>
  );
}
