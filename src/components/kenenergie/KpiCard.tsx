import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "accent" | "positive" | "warning";
}

export default function KpiCard({ label, value, sub, icon: Icon, trend, color = "primary" }: KpiCardProps) {
  const colorMap = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    positive: "bg-positive text-positive-foreground",
    warning: "bg-warning text-warning-foreground",
  };

  return (
    <div className="kpi-card p-5 flex items-start gap-4">
      {Icon && (
        <div className={cn("p-2.5 rounded-lg flex-shrink-0", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-lg font-bold text-foreground font-mono leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
