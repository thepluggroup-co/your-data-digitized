/**
 * AiPanelContext.tsx
 * État global du panneau Claude IA — partagé entre Layout et AiChat.
 *
 * • open   : panneau visible (flottant ou ancré)
 * • pinned : panneau ancré à droite de l'écran (intégré dans le layout flex)
 * • prefill : message pré-rempli depuis une page (ex: "Analyse ce DSCR")
 */

import { createContext, useContext, useState, useCallback } from "react";

interface AiPanelState {
  open:    boolean;
  pinned:  boolean;
  prefill: string | null;
  setOpen:    (v: boolean) => void;
  setPinned:  (v: boolean) => void;
  toggle:     () => void;
  sendPrompt: (text: string) => void;   // ouvre le panel + pré-remplit le champ
  clearPrefill: () => void;
}

const Ctx = createContext<AiPanelState | null>(null);

export function AiPanelProvider({ children }: { children: React.ReactNode }) {
  const [open,    setOpen]    = useState(false);
  const [pinned,  setPinned]  = useState(false);
  const [prefill, setPrefill] = useState<string | null>(null);

  const toggle = useCallback(() => {
    setOpen(v => !v);
  }, []);

  const sendPrompt = useCallback((text: string) => {
    setPrefill(text);
    setOpen(true);
  }, []);

  const clearPrefill = useCallback(() => setPrefill(null), []);

  return (
    <Ctx.Provider value={{ open, pinned, prefill, setOpen, setPinned, toggle, sendPrompt, clearPrefill }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAiPanel(): AiPanelState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAiPanel must be used inside AiPanelProvider");
  return ctx;
}
