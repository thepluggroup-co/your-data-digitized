/**
 * AiPageInsight — Bouton "Analyser avec Claude" contextuel par page.
 * Envoie un prompt pré-rempli vers le panneau Claude IA.
 */
import { useAiPanel } from "@/contexts/AiPanelContext";
import { Sparkles } from "lucide-react";

interface Props {
  prompt: string;
  label?: string;
  variant?: "button" | "inline" | "fab";
  className?: string;
}

export default function AiPageInsight({ prompt, label = "Analyser avec Claude", variant = "button", className = "" }: Props) {
  const { sendPrompt, setOpen } = useAiPanel();

  const handle = () => {
    sendPrompt(prompt);
    setOpen(true);
  };

  if (variant === "fab") {
    return (
      <button
        type="button"
        onClick={handle}
        title={label}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent text-white shadow-lg hover:shadow-xl hover:bg-accent/90 transition-all text-sm font-semibold ${className}`}
      >
        <Sparkles className="w-4 h-4" /> {label}
      </button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handle}
        className={`inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium ${className}`}
      >
        <Sparkles className="w-3 h-3" /> {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors font-medium ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
