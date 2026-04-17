/**
 * ShortcutsHelp.tsx
 * Overlay "Raccourcis clavier" — déclenché par Ctrl+/
 */

import { X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "S"],    label: "Sauvegarder le dossier actif" },
  { keys: ["Ctrl", "Z"],    label: "Annuler — retour à la dernière sauvegarde" },
  { keys: ["Ctrl", "N"],    label: "Nouveau dossier" },
  { keys: ["Ctrl", "O"],    label: "Ouvrir les dossiers" },
  { keys: ["Ctrl", "P"],    label: "Exporter en PDF" },
  { keys: ["Ctrl", "B"],    label: "Réduire / agrandir la sidebar" },
  { keys: ["Ctrl", "/"],    label: "Afficher cette aide" },
  { keys: ["Echap"],        label: "Fermer les fenêtres / overlays" },
];

export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-[slide-up-fade_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-foreground">Raccourcis clavier</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">THE PLUG FINANCE CO</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="space-y-1">
          {SHORTCUTS.map(({ keys, label }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 gap-4"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {keys.map((k, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-[10px] text-muted-foreground/40">+</span>}
                    <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] font-mono font-semibold text-foreground">
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-4">
          Ctrl+/ pour rouvrir cette aide
        </p>
      </div>
    </div>
  );
}
