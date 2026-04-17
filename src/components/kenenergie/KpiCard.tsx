import { cn } from "@/lib/utils";
import { LucideIcon, Sparkles } from "lucide-react";
import { useAiPanel } from "@/contexts/AiPanelContext";

interface KpiCardProps {
  label:   string;
  value:   string;
  sub?:    string;
  icon?:   LucideIcon;
  trend?:  "up" | "down" | "neutral";
  color?:  "primary" | "accent" | "positive" | "warning";
  /** Si fourni, affiche un bouton "Ask AI" qui envoie ce prompt */
  aiPrompt?: string;
}

export default function KpiCard({ label, value, sub, icon: Icon, trend, color = "primary", aiPrompt }: KpiCardProps) {
  const { sendPrompt } = useAiPanel();

  const colorMap = {
    primary:  "bg-primary text-primary-foreground",
    accent:   "bg-accent text-accent-foreground",
    positive: "bg-positive text-positive-foreground",
    warning:  "bg-warning text-warning-foreground",
  };

  return (
    <div className="kpi-depth rounded-xl border border-border p-5 flex items-start gap-4 group relative">
      {Icon && (
        <div className={cn("p-2.5 rounded-lg flex-shrink-0 shadow-sm", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-lg font-bold text-foreground font-mono leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>

      {/* Bouton Ask AI — visible au hover */}
      {aiPrompt && (
        <button
          type="button"
          onClick={() => sendPrompt(aiPrompt)}
          title="Analyser avec Claude IA"
          aria-label="Analyser avec Claude IA"
          className={cn(
            "absolute top-2.5 right-2.5 p-1 rounded-lg",
            "opacity-0 group-hover:opacity-100 transition-all duration-150",
            "bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent"
          )}
        >
          <Sparkles className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
