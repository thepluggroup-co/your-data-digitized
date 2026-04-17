/**
 * useKeyboardShortcuts.ts
 * Raccourcis clavier globaux — utilise des refs pour éviter les stale closures
 * et ne re-enregistre le listener qu'une seule fois.
 */

import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  onSave?:          () => void;
  onUndo?:          () => void;
  onNewDossier?:    () => void;
  onOpenDossiers?:  () => void;
  onExportPdf?:     () => void;
  onToggleSidebar?: () => void;
  onHelp?:          () => void;
  onEscape?:        () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  // Ref toujours à jour — évite de re-enregistrer le listener à chaque render
  const ref = useRef<ShortcutHandlers>(handlers);
  useEffect(() => { ref.current = handlers; });

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT"     ||
                      target.tagName === "TEXTAREA"  ||
                      target.isContentEditable;

      // Ctrl+S — sauvegarde (intercepté même dans les inputs)
      if (ctrl && e.key === "s") {
        e.preventDefault();
        ref.current.onSave?.();
        return;
      }

      // Les raccourcis suivants sont ignorés quand le curseur est dans un champ
      if (inInput) return;

      if (ctrl && e.key === "z")   { e.preventDefault(); ref.current.onUndo?.();          return; }
      if (ctrl && e.key === "n")   { e.preventDefault(); ref.current.onNewDossier?.();    return; }
      if (ctrl && e.key === "o")   { e.preventDefault(); ref.current.onOpenDossiers?.();  return; }
      if (ctrl && e.key === "p")   { e.preventDefault(); ref.current.onExportPdf?.();     return; }
      if (ctrl && e.key === "b")   { e.preventDefault(); ref.current.onToggleSidebar?.(); return; }
      if (ctrl && e.key === "/")   { e.preventDefault(); ref.current.onHelp?.();          return; }
      if (e.key === "Escape")      {                      ref.current.onEscape?.();        return; }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []); // enregistré une seule fois — les refs restent à jour
}
