import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, BarChart3, Settings, FileText,
  Building2, PiggyBank, Wallet, CreditCard, Users, ChevronLeft, ChevronRight, Landmark, Target,
  GitCompare, ShieldAlert, FolderOpen, BellRing, ClipboardList, Lightbulb, Keyboard, Bot, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoThePlug from "@/assets/logo-the-plug.png";
import { useParametres } from "@/contexts/ParametresContext";
import { useAiPanel }    from "@/contexts/AiPanelContext";
import AiChat, { AiChatCore } from "./AiChat";
import SaveBar from "./SaveBar";
import ShortcutsHelp from "./ShortcutsHelp";
import DossierConfigModal from "./DossierConfigModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const navItems = [
  { to: "/",                      icon: LayoutDashboard, label: "Tableau de Bord" },
  { to: "/dossiers",              icon: FolderOpen,      label: "Mes Dossiers" },
  { to: "/configuration-ia",     icon: Bot,             label: "Configuration IA" },
  { to: "/parametres",            icon: Settings,        label: "Paramètres" },
  { to: "/ventes",                icon: TrendingUp,      label: "Ventes" },
  { to: "/salaires",              icon: Users,           label: "Salaires" },
  { to: "/amortissements",        icon: Building2,       label: "Amortissements" },
  { to: "/charges",               icon: FileText,        label: "Charges" },
  { to: "/investissements",       icon: BarChart3,       label: "Investissements" },
  { to: "/resultats",             icon: PiggyBank,       label: "Résultats" },
  { to: "/bilan",                 icon: Wallet,          label: "Bilan" },
  { to: "/emprunt",               icon: CreditCard,      label: "Emprunt" },
  { to: "/plan-financement",      icon: Landmark,        label: "Plan Financement" },
  { to: "/seuil-rentabilite",     icon: Target,          label: "Seuil Rentabilité" },
  { to: "/sensibilite-scenarios", icon: GitCompare,      label: "Scénarios / TIR-VAN" },
  { to: "/synthese-bancaire",     icon: ShieldAlert,     label: "Synthèse Bancaire" },
  { to: "/alertes-bancaires",     icon: BellRing,        label: "Alertes Bancaires" },
  { to: "/covenants",             icon: ClipboardList,   label: "Covenants" },
  { to: "/recommandations-ajustements", icon: Lightbulb, label: "Recommandations" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed,   setCollapsed]  = useState(false);
  const [showHelp,    setShowHelp]   = useState(false);
  const [showConfig,  setShowConfig] = useState(false);
  const { activeDossier, isDirty, resetParams } = useParametres();
  const { open, pinned, toggle, setOpen }       = useAiPanel();
  const navigate = useNavigate();

  // ── Raccourcis globaux ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onUndo:          () => { if (isDirty) resetParams(); },
    onNewDossier:    () => navigate("/dossiers"),
    onOpenDossiers:  () => navigate("/dossiers"),
    onExportPdf:     () => document.querySelector<HTMLButtonElement>("[data-export-pdf]")?.click(),
    onToggleSidebar: () => setCollapsed(c => !c),
    onHelp:          () => setShowHelp(v => !v),
    onEscape:        () => { setShowHelp(false); if (open && !pinned) setOpen(false); },
  });

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={cn(
        "sidebar-depth flex flex-col text-sidebar-foreground transition-all duration-300 flex-shrink-0 relative z-10",
        collapsed ? "w-16" : "w-56"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-4 border-b border-sidebar-border/60 relative",
          collapsed && "justify-center px-2"
        )}>
          {!collapsed && (
            <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 to-transparent pointer-events-none" />
          )}
          <div className="relative flex-shrink-0">
            <img src={logoThePlug} alt="THE PLUG"
              className={cn("object-contain drop-shadow-lg transition-all duration-300", collapsed ? "w-9 h-9" : "w-11 h-11")} />
            <div className={cn("absolute inset-0 rounded-full bg-sidebar-primary/20 blur-md scale-150 -z-10 opacity-0 transition-opacity", !collapsed && "opacity-100")} />
          </div>
          {!collapsed && (
            <div className="relative z-10 min-w-0">
              <div className="text-white font-bold text-sm leading-tight tracking-widest">THE PLUG</div>
              <div className="text-sidebar-primary font-semibold text-[11px] leading-tight tracking-wider">FINANCE CO</div>
              <div className="text-sidebar-foreground/60 text-[9px] mt-0.5 tracking-wide truncate max-w-[120px]" title={activeDossier?.nom ?? "Aucun dossier"}>
                {activeDossier?.nom ?? "Aucun dossier"}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative overflow-hidden",
                isActive ? "nav-glow text-white font-medium" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/70 rounded-r-full" />}
                  <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-150", isActive && "scale-110")} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Active dossier indicator */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-sidebar-border/50">
            {activeDossier ? (
              <div className="rounded-lg px-3 py-2 flex items-center gap-2 bg-sidebar-accent/40">
                <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-sidebar-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-white/80 truncate">{activeDossier.nom}</p>
                  {isDirty && <p className="text-[9px] text-warning/80">· modifié</p>}
                </div>
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0 animate-pulse" />}
              </div>
            ) : (
              <p className="text-[9px] text-sidebar-foreground/30 text-center py-1">Aucun dossier actif</p>
            )}
          </div>
        )}

        {/* Footer + AI toggle button */}
        <div className={cn("px-3 py-2 border-t border-sidebar-border/50 space-y-1", collapsed && "px-2")}>
          {/* Bouton Configuration dossier */}
          <button type="button" onClick={() => setShowConfig(true)}
            title="Configurer le dossier"
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-xs font-semibold",
              "bg-sidebar-accent/40 text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-white border border-transparent",
              collapsed ? "px-1" : "px-3"
            )}>
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Configurer dossier</span>}
          </button>
          {/* Bouton Claude IA */}
          <button type="button" onClick={toggle}
            title="Claude IA (Ctrl+I)"
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-xs font-semibold",
              (open || pinned)
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-sidebar-accent/40 text-sidebar-foreground/70 hover:bg-accent/15 hover:text-accent border border-transparent hover:border-accent/20",
              collapsed ? "px-1" : "px-3"
            )}>
            <Bot className={cn("flex-shrink-0", (open || pinned) ? "w-4 h-4 text-accent" : "w-4 h-4")} />
            {!collapsed && (
              <span>{(open || pinned) ? "Claude IA actif" : "Claude IA"}</span>
            )}
            {(open || pinned) && !collapsed && (
              <span className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
            )}
          </button>

          {!collapsed && (
            <>
              <p className="text-[9px] text-sidebar-primary/80 text-center font-bold tracking-widest uppercase mt-1">
                THE PLUG FINANCE CO
              </p>
              <p className="text-[8px] text-sidebar-foreground/25 text-center tracking-wide">
                Connexion that drives innovation
              </p>
              <button type="button" onClick={() => setShowHelp(true)}
                className="w-full flex items-center justify-center gap-1.5 text-[9px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors py-0.5 rounded"
                title="Raccourcis clavier (Ctrl+/)">
                <Keyboard className="w-3 h-3" /> Ctrl+/ pour les raccourcis
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button type="button" onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 border-t border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
            : <ChevronLeft  className="w-4 h-4 text-sidebar-foreground/60" />
          }
        </button>
      </aside>

      {/* ── Content + docked AI panel ── */}
      <div className="flex flex-1 min-w-0 overflow-hidden">

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-auto min-w-0">
          <div className="p-6 flex-1">
            <SaveBar />
            {children}
          </div>
        </main>

        {/* Docked AI panel — flex child, s'affiche à droite quand pinned */}
        {pinned && open && (
          <div className="flex-shrink-0 overflow-hidden w-[380px]">
            <AiChatCore mode="dock" />
          </div>
        )}
      </div>

      {/* Floating AI chat — quand pas ancré */}
      {!pinned && <AiChat />}

      {/* Raccourcis overlay */}
      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}

      {/* Configuration dossier modal */}
      {showConfig && <DossierConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  );
}
