/**
 * AiChat.tsx
 * Claude IA — Extension intégrée à THE PLUG FINANCE CO
 *
 * Deux modes :
 *  • float  : bulle flottante bas-droite (comportement actuel)
 *  • dock   : panneau ancré à droite du layout (flex child, intégré)
 *
 * Fonctionnalités :
 *  - Modifications directes de paramètres via [APPLY_PARAMS]{...}[/APPLY_PARAMS]
 *  - Context-aware : connaît la page courante et les données du dossier actif
 *  - Suggestions rapides adaptées à la page
 *  - Pin/unpin pour switcher entre modes
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Bot, X, Send, Loader2, Minimize2, ChevronDown, Sparkles,
  CheckCircle2, AlertCircle, Pencil, PinIcon, PinOff,
  RotateCcw, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParametres }  from "@/contexts/ParametresContext";
import type { EditableParams } from "@/contexts/ParametresContext";
import { useAiPanel }     from "@/contexts/AiPanelContext";
import { sendChat }       from "@/lib/ai-service";
import type { ChatMessage } from "@/lib/ai-service";

// ── Page-aware context ────────────────────────────────────────────────────────

const PAGE_CONTEXT: Record<string, { label: string; icon: string; suggestions: string[] }> = {
  "/":                          { label: "Tableau de Bord",    icon: "📊",
    suggestions: ["Analyse mon score de bancabilité", "Quels ratios améliorer en priorité ?", "Résume les points forts et faibles du dossier"] },
  "/resultats":                 { label: "Résultats",          icon: "📈",
    suggestions: ["Améliore la marge nette à 15%", "Analyse l'évolution du résultat sur 5 ans", "Comment réduire l'IS légalement ?"] },
  "/bilan":                     { label: "Bilan",              icon: "⚖️",
    suggestions: ["Analyse l'équilibre bilan actif/passif", "Comment améliorer l'autonomie financière ?", "Explique le FRN et le BFR"] },
  "/plan-financement":          { label: "Plan Financement",   icon: "💳",
    suggestions: ["La trésorerie est-elle suffisante ?", "Optimise la structure de financement", "Analyse la couverture des remboursements"] },
  "/synthese-bancaire":         { label: "Synthèse Bancaire",  icon: "🏦",
    suggestions: ["Génère un argumentaire bancaire", "Analyse le DSCR et ICR", "Points à renforcer pour la banque"] },
  "/ventes":                    { label: "Ventes",             icon: "🛒",
    suggestions: ["Augmente le CA de 10% sur l'année 3", "Analyse les pôles de revenus", "Optimise les niveaux d'activité"] },
  "/charges":                   { label: "Charges",            icon: "💸",
    suggestions: ["Réduis les charges externes à 18% du CA", "Identifie les postes à optimiser", "Quel taux de charges est normatif ?"] },
  "/salaires":                  { label: "Salaires",           icon: "👥",
    suggestions: ["Analyse la masse salariale vs CA", "Recommande un taux d'augmentation", "Quel est le ratio masse salariale / valeur ajoutée ?"] },
  "/investissements":           { label: "Investissements",    icon: "🏗️",
    suggestions: ["Le plan d'investissement est-il cohérent ?", "Analyse le TIR de ce projet", "Quelle durée d'amortissement recommandes-tu ?"] },
  "/emprunt":                   { label: "Emprunt",            icon: "🏛️",
    suggestions: ["Ce niveau d'endettement est-il acceptable ?", "Négocie le meilleur taux emprunt", "Impact d'une hausse de 1 point des taux"] },
  "/seuil-rentabilite":         { label: "Seuil Rentabilité",  icon: "🎯",
    suggestions: ["Quel est le délai pour atteindre la rentabilité ?", "Comment baisser le point mort ?", "Analyse la marge de sécurité"] },
  "/sensibilite-scenarios":     { label: "Scénarios",          icon: "🔀",
    suggestions: ["Simule un scénario pessimiste CA -20%", "Quel impact si les charges augmentent de 5% ?", "Scénario stress test bancaire"] },
  "/alertes-bancaires":         { label: "Alertes Bancaires",  icon: "🔔",
    suggestions: ["Explique les alertes critiques", "Comment résoudre les covenants en défaut ?", "Priorise les actions correctives"] },
  "/dossiers":                  { label: "Mes Dossiers",       icon: "📁",
    suggestions: ["Analyse un document financier", "Compare les dossiers disponibles", "Génère un rapport de synthèse"] },
  "/configuration-ia":          { label: "Configuration IA",  icon: "🤖",
    suggestions: ["Vérifie ma connexion Claude", "Explique les limites de tokens", "Comment optimiser mes prompts ?"] },
};

function getPageCtx(pathname: string) {
  return PAGE_CONTEXT[pathname] ?? { label: "Application", icon: "💼", suggestions: [] };
}

// ── Param labels ──────────────────────────────────────────────────────────────

const PARAM_LABELS: Partial<Record<keyof EditableParams, string>> = {
  capitalSocial: "Capital social", augmentationCapital: "Augmentation capital",
  endettementLT: "Emprunt LT", comptesCourantsAssocies: "CCA",
  txInteretEmpruntLT: "Taux intérêt LT", tauxImpotSocietes: "Taux IS",
  txDistributionBenefices: "Taux dividendes", niveauxActivite: "Niveaux activité",
  tauxAugmentationSalaires: "Augment. salaires", tauxMatierePremiere: "Taux matières",
  tauxAutresAchats: "Taux autres achats", tauxTransport: "Taux transport",
  tauxServicesExt: "Taux serv. ext.", tauxLoyer: "Taux loyer",
  tauxAssurances: "Taux assurances", tauxMaintenance: "Taux maintenance",
  tauxHonoraires: "Taux honoraires", tauxTelecom: "Taux télécom",
  tauxPublicite: "Taux publicité", tauxFormation: "Taux formation",
  tauxDeplacements: "Taux déplacements", tauxImpotsTaxes: "Taux impôts",
  tauxAutresCharges: "Taux autres charges", tauxCommissionsVentes: "Taux commissions",
  tauxChargesSociales: "Taux charges soc.", fixedAchatsMP: "Achats MP (fixe)",
  fixedLoyer: "Loyer (fixe)", fixedAssurances: "Assurances (fixe)",
  fixedMaintenance: "Maintenance (fixe)", fixedHonoraires: "Honoraires (fixe)",
};

function fmtVal(v: unknown, key: string): string {
  if (Array.isArray(v)) return (v as number[]).map(x => `${(x * 100).toFixed(0)}%`).join(" · ");
  if (typeof v === "number") {
    if (Math.abs(v) < 2 && (key.startsWith("taux") || key.startsWith("tx"))) return `${(v * 100).toFixed(2)}%`;
    return v.toLocaleString("fr-FR") + " FCFA";
  }
  return String(v);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ParamPatch = Partial<Record<keyof EditableParams, unknown>>;
interface PendingPatch { msgIndex: number; patch: ParamPatch; }

function parseParamBlock(text: string): { clean: string; patch: ParamPatch | null } {
  const re = /\[APPLY_PARAMS\]\s*([\s\S]*?)\s*\[\/APPLY_PARAMS\]/;
  const m  = re.exec(text);
  if (!m) return { clean: text, patch: null };
  try {
    return { clean: text.replace(re, "").trim(), patch: JSON.parse(m[1]) as ParamPatch };
  } catch {
    return { clean: text.replace(re, "").trim(), patch: null };
  }
}

function renderMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       '<code class="bg-muted/60 px-1 rounded text-[10px] font-mono">$1</code>')
    .replace(/\n/g,            "<br />");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ApplyCard({ patch, params, onApply, onDismiss }: {
  patch: ParamPatch; params: EditableParams;
  onApply: () => void; onDismiss: () => void;
}) {
  const entries = Object.entries(patch) as [keyof EditableParams, unknown][];
  return (
    <div className="mx-1 mb-3 rounded-xl border-2 border-accent/40 bg-accent/5 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Pencil className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span className="text-xs font-bold text-accent">
          {entries.length} modification{entries.length > 1 ? "s" : ""} proposée{entries.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="rounded-lg bg-muted/30 border border-border/40 px-2.5 py-1.5">
            <p className="text-[10px] font-semibold">{PARAM_LABELS[key] ?? key}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {fmtVal((params as Record<string, unknown>)[key as string], key as string)} → {fmtVal(val, key as string)}
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-0.5">
        <button type="button" onClick={onApply}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors">
          <CheckCircle2 className="w-3.5 h-3.5" /> Appliquer
        </button>
        <button type="button" onClick={onDismiss}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted/40 transition-colors">
          <AlertCircle className="w-3.5 h-3.5" /> Ignorer
        </button>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2 mb-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
        </div>
      )}
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
        isUser ? "bg-accent text-white rounded-tr-sm"
               : "glass-panel border border-border/50 text-foreground rounded-tl-sm"
      )} dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
    </div>
  );
}

// ── Core chat logic (shared between float and dock) ───────────────────────────

export function AiChatCore({ mode }: { mode: "float" | "dock" }) {
  const { computed, activeDossier, params, updateParam, saveCurrentDossier } = useParametres();
  const { open, pinned, prefill, setOpen, setPinned, clearPrefill } = useAiPanel();
  const location = useLocation();
  const pageCtx  = getPageCtx(location.pathname);

  const [minimized, setMin]       = useState(false);
  const [input, setInput]         = useState("");
  const [history, setHistory]     = useState<ChatMessage[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [unread, setUnread]       = useState(0);
  const [pendingPatch, setPending] = useState<PendingPatch | null>(null);
  const [appliedCount, setApplied] = useState(0);

  const scrollRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const isFirstOpen  = useRef(true);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading, pendingPatch]);

  // Apply prefill from external sendPrompt()
  useEffect(() => {
    if (prefill && open && !minimized) {
      setInput(prefill);
      clearPrefill();
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [prefill, open, minimized, clearPrefill]);

  // Welcome message + focus
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
      if (isFirstOpen.current && history.length === 0) {
        isFirstOpen.current = false;
        setHistory([{
          role: "assistant",
          content: activeDossier
            ? `Bonjour ! Je suis votre assistant financier IA.\n\nJ'ai accès au dossier **${activeDossier.nom}** et je suis sur la page **${pageCtx.icon} ${pageCtx.label}**.\n\nJe peux analyser vos indicateurs et **modifier les paramètres directement** si vous me le demandez.`
            : `Bonjour ! Je suis votre assistant financier IA.\n\nPage actuelle : **${pageCtx.icon} ${pageCtx.label}**\n\nChargez un dossier pour que je puisse analyser vos données.`,
        }]);
      }
    }
  }, [open, minimized]);

  const buildContext = (): Record<string, unknown> => {
    const ctx: Record<string, unknown> = {
      pageCourante: `${pageCtx.icon} ${pageCtx.label}`,
      route: location.pathname,
    };
    if (activeDossier) ctx.dossier = { nom: activeDossier.nom, client: activeDossier.client };
    if (computed.resultats) {
      ctx.resultats = computed.resultats;
      ctx.banking   = computed.banking;
      ctx.bilan     = computed.bilan;
    }
    ctx.parametresActuels = params;
    return ctx;
  };

  const handleSend = async (msgOverride?: string) => {
    const msg = (msgOverride ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);
    setPending(null);
    const userMsg: ChatMessage = { role: "user", content: msg };
    const prevHistory = history;
    setHistory(h => [...h, userMsg]);
    setLoading(true);
    try {
      const res = await sendChat(msg, buildContext(), prevHistory);
      const lastMsg = res.history[res.history.length - 1];
      if (lastMsg?.role === "assistant") {
        const { clean, patch } = parseParamBlock(lastMsg.content);
        if (patch && Object.keys(patch).length > 0) {
          const cleanHistory = [...res.history.slice(0, -1), { role: "assistant" as const, content: clean }];
          setHistory(cleanHistory);
          setPending({ msgIndex: cleanHistory.length - 1, patch });
        } else {
          setHistory(res.history);
        }
      } else {
        setHistory(res.history);
      }
      if (!open || minimized) setUnread(u => u + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
      setHistory(prevHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!pendingPatch) return;
    let count = 0;
    for (const [key, val] of Object.entries(pendingPatch.patch) as [keyof EditableParams, unknown][]) {
      try { updateParam(key, val as EditableParams[typeof key]); count++; } catch { /* skip */ }
    }
    setPending(null);
    setApplied(c => c + count);
    setTimeout(() => saveCurrentDossier(), 300);
    setHistory(h => [...h, {
      role: "assistant",
      content: `**${count} paramètre${count > 1 ? "s" : ""} modifié${count > 1 ? "s" : ""}** avec succès. Dossier sauvegardé automatiquement.`,
    }]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setHistory([]); setPending(null); isFirstOpen.current = true; setError(null);
  };

  const isFloat = mode === "float";
  const isDock  = mode === "dock";

  // ── Wrapper classes ─────────────────────────────────────────────────────────
  const wrapperCls = isFloat
    ? cn(
        "fixed bottom-5 right-5 z-50 flex flex-col rounded-2xl shadow-2xl border border-border/60 glass-panel",
        "transition-all duration-300 ease-out",
        open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none",
        minimized ? "h-14 w-80" : "w-[400px] h-[600px]",
        "max-h-[calc(100vh-24px)]"
      )
    : cn(
        "flex flex-col h-full border-l border-border/60 bg-background",
        "transition-all duration-300",
        minimized ? "w-14" : "w-[380px]"
      );

  return (
    <div className={wrapperCls} style={isFloat ? { maxHeight: "calc(100vh - 24px)" } : undefined}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 py-3 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-accent/10 to-transparent",
        isFloat ? "rounded-t-2xl" : "",
        minimized && isDock ? "flex-col px-2 py-3 gap-1 items-center" : ""
      )}>
        <div className={cn(
          "rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0",
          minimized && isDock ? "w-8 h-8" : "w-7 h-7"
        )}>
          <Sparkles className={cn("text-accent", minimized && isDock ? "w-4 h-4" : "w-3.5 h-3.5")} />
        </div>

        {(!minimized || isFloat) && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Claude IA
              <span className="text-[10px] text-muted-foreground font-normal border border-border/50 rounded px-1 py-0.5">
                {pageCtx.icon} {pageCtx.label}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {activeDossier ? activeDossier.nom : "Aucun dossier actif"}
              {appliedCount > 0 && (
                <span className="ml-1.5 text-accent font-semibold">{appliedCount} modif.</span>
              )}
            </p>
          </div>
        )}

        <div className={cn("flex items-center gap-1 flex-shrink-0", minimized && isDock ? "flex-col" : "")}>
          {/* Effacer */}
          {!minimized && history.length > 1 && (
            <button type="button" onClick={clearChat} title="Effacer la conversation"
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-medium px-2">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Pin/Unpin — float uniquement */}
          {isFloat && !minimized && (
            <button type="button" onClick={() => { setPinned(true); }}
              title="Ancrer le panneau à droite"
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <PinIcon className="w-4 h-4" />
            </button>
          )}
          {/* Unpin — dock uniquement */}
          {isDock && !minimized && (
            <button type="button" onClick={() => setPinned(false)}
              title="Détacher le panneau"
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <PinOff className="w-4 h-4" />
            </button>
          )}
          {/* Minimize */}
          <button type="button" onClick={() => setMin(m => !m)}
            title={minimized ? "Agrandir" : "Réduire"}
            aria-label={minimized ? "Agrandir" : "Réduire"}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            {minimized
              ? (isDock ? <Maximize2 className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)
              : <Minimize2 className="w-4 h-4" />
            }
          </button>
          {/* Fermer */}
          <button type="button" onClick={() => { setOpen(false); setMin(false); }}
            title="Fermer" aria-label="Fermer l'assistant"
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      {!minimized && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth">
            {history.map((msg, i) => (
              <div key={i}>
                <Bubble msg={msg} />
                {pendingPatch?.msgIndex === i && (
                  <ApplyCard patch={pendingPatch.patch} params={params} onApply={handleApply} onDismiss={() => setPending(null)} />
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                </div>
                <div className="glass-panel border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                  <span className="text-xs text-muted-foreground">Analyse en cours…</span>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 mb-2">
                {error}
              </div>
            )}
          </div>

          {/* ── Quick suggestions ───────────────────────────────────────────── */}
          {history.length <= 1 && pageCtx.suggestions.length > 0 && (
            <div className="px-3 pb-2 flex flex-col gap-1">
              <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider px-1 mb-0.5">
                Suggestions — {pageCtx.label}
              </p>
              {pageCtx.suggestions.map(s => (
                <button key={s} type="button"
                  onClick={() => handleSend(s)}
                  className="text-left text-[11px] px-3 py-1.5 rounded-lg border border-accent/20 text-accent/80 hover:bg-accent/10 hover:border-accent/40 transition-colors w-full truncate">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ───────────────────────────────────────────────────────── */}
          <div className="px-3 pb-3 flex-shrink-0 border-t border-border/30 pt-2.5">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ex : ${pageCtx.suggestions[0] ?? "Pose ta question…"}`}
                rows={1}
                aria-label="Message à Claude"
                className={cn(
                  "flex-1 resize-none bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5",
                  "text-xs text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50",
                  "transition-all max-h-24 overflow-y-auto min-h-[38px]"
                )}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
                }}
              />
              <button type="button" onClick={() => handleSend()} disabled={!input.trim() || loading}
                aria-label="Envoyer"
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                  input.trim() && !loading ? "bg-accent hover:bg-accent/80 text-white shadow-sm" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5">
              Claude peut modifier les paramètres · Entrée pour envoyer
            </p>
          </div>
        </>
      )}

      {/* Collapsed dock — show icon and route label vertically */}
      {minimized && isDock && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
          <span className="text-lg">{pageCtx.icon}</span>
          <span
            className="text-[10px] text-muted-foreground font-medium"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Claude IA
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main export — decides float vs dock ──────────────────────────────────────

export default function AiChat() {
  const { open, pinned, setOpen } = useAiPanel();

  return (
    <>
      {/* Floating button — visible quand panel fermé et pas ancré */}
      {!open && !pinned && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-5 right-5 z-50 rounded-full shadow-2xl flex items-center justify-center",
            "bg-gradient-to-br from-accent to-accent/70 hover:scale-110 hover:shadow-accent/30 transition-all duration-300",
          )}
          title="Ouvrir Claude IA"
          aria-label="Ouvrir l'assistant Claude IA"
          style={{ width: 52, height: 52 }}
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Floating panel — quand open et non ancré */}
      {open && !pinned && <AiChatCore mode="float" />}
    </>
  );
}
