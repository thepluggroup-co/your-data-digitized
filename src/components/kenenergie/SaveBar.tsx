/**
 * SaveBar.tsx
 * Barre de sauvegarde intelligente — sticky en haut du contenu principal.
 *
 * États : idle → dirty (pulse ambre) → saving (spinner) → saved (vert, 2s) → idle
 * Raccourci clavier : Ctrl+S / Cmd+S
 * Auto-save : 30 s après la dernière modification
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Save, Check, Loader2, Clock, FolderOpen } from "lucide-react";
import { useParametres } from "@/contexts/ParametresContext";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "dirty" | "saving" | "saved";

const AUTO_SAVE_DELAY = 30_000; // 30 s

export default function SaveBar() {
  const { isDirty, saveCurrentDossier, activeDossier } = useParametres();

  const [state, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);
  const autoTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with isDirty
  useEffect(() => {
    if (isDirty) {
      setSaveState("dirty");

      // Reset auto-save timer on every change
      if (autoTimer.current) clearTimeout(autoTimer.current);
      autoTimer.current = setTimeout(() => {
        handleSave("auto");
      }, AUTO_SAVE_DELAY);
    } else if (state === "dirty") {
      // Was dirty, externally cleared (e.g. loadDossier)
      setSaveState("idle");
    }
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [isDirty]);

  const handleSave = useCallback(async (trigger: "user" | "keyboard" | "auto" = "user") => {
    if (state === "saving") return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setSaveState("saving");
    try {
      await Promise.resolve(saveCurrentDossier());
      setLastSaved(new Date());
      setSaveState("saved");
      // Retour idle après 2,5 s
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState("idle"), 2500);
      if (trigger === "auto") console.info("[SaveBar] Auto-save effectué");
    } catch {
      setSaveState("dirty"); // retour à dirty si erreur
    }
  }, [state, saveCurrentDossier]);

  // Ctrl+S / Cmd+S global
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) handleSave("keyboard");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDirty, handleSave]);

  // Nettoyage
  useEffect(() => () => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  // Invisible si aucun dossier ou état idle
  const visible = state !== "idle" || lastSaved !== null;
  if (!visible && state === "idle") return null;

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-xs rounded-xl mb-4 border transition-all duration-300",
        state === "dirty"  && "bg-warning/10 border-warning/30 text-warning animate-pulse",
        state === "saving" && "bg-accent/10  border-accent/30  text-accent",
        state === "saved"  && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        state === "idle"   && lastSaved && "bg-muted/40 border-border/40 text-muted-foreground"
      )}
    >
      {/* Icône gauche */}
      <span className="flex-shrink-0">
        {state === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === "saved"  && <Check   className="w-3.5 h-3.5" />}
        {state === "dirty"  && <Save    className="w-3.5 h-3.5" />}
        {state === "idle"   && <Clock   className="w-3.5 h-3.5 text-muted-foreground/60" />}
      </span>

      {/* Message */}
      <span className="flex-1 font-medium">
        {state === "dirty"  && (
          <>
            Modifications non sauvegardées
            {activeDossier && (
              <span className="ml-1.5 font-normal opacity-70">· {activeDossier.nom}</span>
            )}
            <span className="ml-1.5 opacity-50 font-normal">Auto-save dans 30 s</span>
          </>
        )}
        {state === "saving" && "Sauvegarde en cours…"}
        {state === "saved"  && (
          <>
            Sauvegardé
            {activeDossier && <span className="ml-1.5 font-normal opacity-70">· {activeDossier.nom}</span>}
            {lastSaved && <span className="ml-1.5 opacity-60 font-normal">à {fmtTime(lastSaved)}</span>}
          </>
        )}
        {state === "idle" && lastSaved && (
          <>
            <FolderOpen className="inline w-3 h-3 mr-1 opacity-50" />
            {activeDossier?.nom ?? "Dossier"} · sauvegardé à {fmtTime(lastSaved)}
          </>
        )}
      </span>

      {/* Raccourci + bouton */}
      {state === "dirty" && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline text-[10px] opacity-50 font-mono">Ctrl+S</span>
          <button
            type="button"
            onClick={() => handleSave("user")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warning text-warning-foreground font-semibold hover:bg-warning/80 transition-colors text-[11px]"
          >
            <Save className="w-3 h-3" /> Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
}
