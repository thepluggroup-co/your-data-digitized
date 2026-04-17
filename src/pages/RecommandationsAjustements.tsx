import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/kenenergie/PageHeader";
import { useParametres } from "@/contexts/ParametresContext";
import { analyzeAndRecommend } from "@/lib/recommandations-engine";
import type { Recommandation, Issue, Severity, Category } from "@/lib/recommandations-engine";
import { formatFcfa, YEARS } from "@/lib/kenenergie-data";
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle2, ChevronDown, ChevronRight,
  Sliders, ArrowRight, TrendingUp, Landmark, ShieldCheck, Zap, Lightbulb,
  BarChart3, Target, Clock, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────
function severityConfig(s: Severity) {
  switch (s) {
    case "critical": return { icon: AlertOctagon, bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", badge: "bg-red-500/15 text-red-400 border-red-500/30", label: "Critique" };
    case "major":    return { icon: AlertTriangle, bg: "bg-amber-400/10 border-amber-400/30", text: "text-amber-300", badge: "bg-amber-400/15 text-amber-300 border-amber-400/30", label: "Majeur" };
    case "minor":    return { icon: Info, bg: "bg-blue-400/10 border-blue-400/30", text: "text-blue-400", badge: "bg-blue-400/15 text-blue-400 border-blue-400/30", label: "Mineur" };
  }
}

function categoryLabel(c: Category) {
  const map: Record<Category, { label: string; icon: typeof Zap }> = {
    solvabilite:       { label: "Solvabilité",       icon: ShieldCheck },
    liquidite:         { label: "Liquidité",         icon: Zap },
    rentabilite:       { label: "Rentabilité",       icon: TrendingUp },
    structure_capital: { label: "Structure capital", icon: Landmark },
    remboursement:     { label: "Remboursement",     icon: BarChart3 },
    croissance:        { label: "Croissance",        icon: Target },
    charges:           { label: "Charges",           icon: Wrench },
  };
  return map[c] ?? { label: c, icon: Info };
}

function priorityBadge(p: 1 | 2 | 3) {
  if (p === 1) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Priorité 1 — Urgent</span>;
  if (p === 2) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">Priorité 2 — Court terme</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-400/15 text-blue-400 border border-blue-400/30">Priorité 3 — Moyen terme</span>;
}

function effortBadge(e: Recommandation["effort"]) {
  const map = {
    "immédiat":     "bg-red-500/10 text-red-400",
    "court terme":  "bg-amber-400/10 text-amber-300",
    "moyen terme":  "bg-blue-400/10 text-blue-400",
  } as const;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${map[e]}`}><Clock className="w-2.5 h-2.5 inline mr-0.5" />{e}</span>;
}

// ── Issue Card ────────────────────────────────────────────────────────────────
function IssueCard({ issue }: { issue: Issue }) {
  const cfg = severityConfig(issue.severity);
  const Icon = cfg.icon;
  const cat = categoryLabel(issue.category);
  const CatIcon = cat.icon;
  return (
    <div className={`rounded-xl border p-4 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold ${cfg.text}`}>{issue.title}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <CatIcon className="w-2.5 h-2.5" /> {cat.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{issue.description}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Valeur actuelle : <span className={`font-mono font-bold ${cfg.text}`}>{issue.currentValue}</span></span>
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Cible : <span className="font-mono font-bold text-emerald-400">{issue.targetValue}</span></span>
          </div>
          {issue.affectedYears.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {issue.affectedYears.map(y => (
                <span key={y} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono">{y}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────
function RecCard({ rec, onApply }: { rec: Recommandation; onApply: (rec: Recommandation) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryLabel(rec.categorie);
  const CatIcon = cat.icon;

  return (
    <div className="kpi-depth rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-shrink-0 p-2 rounded-lg bg-accent/10">
          <CatIcon className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {priorityBadge(rec.priority)}
            {effortBadge(rec.effort)}
          </div>
          <p className="text-sm font-semibold text-foreground">{rec.titre}</p>
          <p className="text-xs text-muted-foreground mt-0.5">KPI cible : <span className="text-accent font-medium">{rec.kpi}</span>
            {rec.gainEstime && <span className="ml-2 text-emerald-400 font-mono">→ {rec.gainEstime}</span>}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
          {/* Diagnostic detail */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-accent" /> Analyse & Plan d'action
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{rec.detail}</p>
          </div>

          {/* Parameter change */}
          {rec.parametre && rec.valeurActuelle !== undefined && rec.valeurSuggeree !== undefined && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <p className="text-xs font-semibold text-accent mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Ajustement paramétrique suggéré
              </p>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Paramètre</p>
                  <p className="font-mono font-bold text-foreground">{String(rec.parametre)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Valeur actuelle</p>
                  <p className="font-mono font-bold text-amber-300">
                    {rec.parametre === "txInteretEmpruntLT" ? (rec.valeurActuelle * 100).toFixed(2) + "%" :
                     rec.parametre === "tauxServicesExt"    ? (rec.valeurActuelle * 100).toFixed(2) + "%" :
                     rec.parametre === "niveauxActivite"    ? (rec.valeurActuelle * 100).toFixed(0) + "%" :
                     rec.valeurActuelle.toLocaleString("fr-FR") + " FCFA"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Valeur suggérée</p>
                  <p className="font-mono font-bold text-emerald-400">
                    {rec.parametre === "txInteretEmpruntLT" ? (rec.valeurSuggeree * 100).toFixed(2) + "%" :
                     rec.parametre === "tauxServicesExt"    ? (rec.valeurSuggeree * 100).toFixed(2) + "%" :
                     rec.parametre === "niveauxActivite"    ? (rec.valeurSuggeree * 100).toFixed(0) + "%" :
                     rec.valeurSuggeree.toLocaleString("fr-FR") + " FCFA"}
                    {rec.deltaPct !== undefined && (
                      <span className="ml-1.5 text-[10px]">({rec.deltaPct > 0 ? "+" : ""}{rec.deltaPct}%)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Impact */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Impact attendu
            </p>
            <p className="text-xs text-muted-foreground">{rec.impactAttendu}</p>
          </div>

          {/* Apply button */}
          {rec.parametre && (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-accent hover:bg-accent/90 text-white"
                onClick={() => onApply(rec)}
              >
                <Sliders className="w-3.5 h-3.5" /> Appliquer cet ajustement
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Profil verdict ────────────────────────────────────────────────────────────
function ProfilBanner({ profil, score }: { profil: "BANCABLE" | "A_CONSOLIDER" | "NON_BANCABLE"; score: number }) {
  const cfg = {
    BANCABLE:      { cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", label: "PROFIL BANCABLE", icon: CheckCircle2 },
    A_CONSOLIDER:  { cls: "bg-amber-400/10  border-amber-400/30  text-amber-300",    label: "À CONSOLIDER",   icon: AlertTriangle },
    NON_BANCABLE:  { cls: "bg-red-500/10    border-red-500/30    text-red-400",       label: "NON BANCABLE",   icon: AlertOctagon  },
  }[profil];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${cfg.cls}`}>
      <Icon className={`w-8 h-8 flex-shrink-0 ${cfg.cls.split(" ").at(-1)}`} />
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className={`text-xl font-black tracking-wider ${cfg.cls.split(" ").at(-1)}`}>{cfg.label}</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.cls}`}>Score {score}/100</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {profil === "BANCABLE"     ? "Le projet présente un profil globalement favorable. Appliquer les recommandations ci-dessous pour renforcer le dossier." :
           profil === "A_CONSOLIDER" ? "Des ajustements ciblés sont nécessaires avant présentation à la banque. Traiter en priorité les points critiques." :
                                       "Restructuration significative requise. Implémenter d'urgence les recommandations de priorité 1."}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RecommandationsAjustements() {
  const navigate = useNavigate();
  const { computed, params, updateParam, activeDossier } = useParametres();
  const [appliedRecs, setAppliedRecs] = useState<string[]>([]);
  const [confirmApply, setConfirmApply] = useState<Recommandation | null>(null);
  const [filterPriority, setFilterPriority] = useState<1 | 2 | 3 | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);

  const analysis = analyzeAndRecommend(computed, params);
  const { issues, recommandations, scoreAvant, notes, profil } = analysis;

  const nbCritical = issues.filter(i => i.severity === "critical").length;
  const nbMajor    = issues.filter(i => i.severity === "major").length;
  const nbMinor    = issues.filter(i => i.severity === "minor").length;

  const filteredRecs = recommandations.filter(r => {
    if (filterPriority && r.priority !== filterPriority) return false;
    if (filterCategory && r.categorie !== filterCategory) return false;
    return true;
  });

  const handleApply = (rec: Recommandation) => setConfirmApply(rec);

  const doApply = (rec: Recommandation) => {
    if (!rec.parametre || rec.valeurSuggeree === undefined) return;
    if (rec.parametre === "niveauxActivite") {
      const next = [...params.niveauxActivite] as [number, number, number, number, number];
      next[0] = rec.valeurSuggeree;
      updateParam("niveauxActivite", next);
    } else {
      updateParam(rec.parametre as keyof typeof params, rec.valeurSuggeree as any);
    }
    setAppliedRecs(prev => [...prev, rec.id]);
    setConfirmApply(null);
  };

  const categories = [...new Set(recommandations.map(r => r.categorie))];

  return (
    <div className="space-y-6">
      {/* Confirm dialog */}
      {confirmApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[slide-up-fade_0.2s_ease]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-accent/15">
                <Sliders className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Appliquer l'ajustement ?</h2>
                <p className="text-xs text-muted-foreground">Les projections se recalculeront automatiquement</p>
              </div>
            </div>
            <div className="rounded-xl bg-muted/30 p-4 mb-4 space-y-2 text-xs">
              <p className="font-semibold text-foreground">{confirmApply.titre}</p>
              {confirmApply.parametre && (
                <p className="text-muted-foreground">
                  Paramètre <span className="font-mono text-accent">{confirmApply.parametre}</span> :
                  <span className="font-mono text-amber-300 ml-1">{confirmApply.valeurActuelle}</span>
                  <ArrowRight className="w-3 h-3 inline mx-1 text-muted-foreground" />
                  <span className="font-mono text-emerald-400">{confirmApply.valeurSuggeree}</span>
                </p>
              )}
              <p className="text-muted-foreground italic">{confirmApply.impactAttendu}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmApply(null)}>Annuler</Button>
              <Button type="button" className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-white" onClick={() => doApply(confirmApply)}>
                <CheckCircle2 className="w-4 h-4" /> Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Recommandations & Ajustements"
        subtitle="Algorithme d'analyse des points critiques — KENENERGIE SARL (projet de référence)"
        badge={`${recommandations.length} recommandations`}
      />

      {/* Profil banner */}
      <ProfilBanner profil={profil} score={scoreAvant} />

      {/* Issue summary */}
      <div className="kpi-primary-depth rounded-xl px-5 py-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-3xl font-bold text-red-400">{nbCritical}</p>
          <p className="text-white/60 text-xs mt-0.5">Points critiques</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-3xl font-bold text-amber-300">{nbMajor}</p>
          <p className="text-white/60 text-xs mt-0.5">Points majeurs</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-400">{nbMinor}</p>
          <p className="text-white/60 text-xs mt-0.5">Points mineurs</p>
        </div>
      </div>

      {/* ── Detected Issues ── */}
      {issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-bold text-foreground">Points détectés ({issues.length})</h2>
          </div>
          {/* Critical first */}
          {(["critical", "major", "minor"] as Severity[]).map(sev =>
            issues.filter(i => i.severity === sev).map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      )}

      {issues.length === 0 && (
        <div className="kpi-depth rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-base font-bold text-emerald-400">Aucun point critique détecté</p>
          <p className="text-sm text-muted-foreground mt-1">Le projet KENENERGIE satisfait tous les ratios de référence sur la période 2027–2031.</p>
        </div>
      )}

      {/* ── Recommendations ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Plan d'ajustements recommandés ({recommandations.length})</h2>
          </div>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground self-center">Filtrer :</span>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPriority(filterPriority === p as 1 | 2 | 3 ? null : p as 1 | 2 | 3)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  filterPriority === p
                    ? "bg-accent/20 border-accent/50 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                P{p}
              </button>
            ))}
            {categories.map(cat => {
              const { label } = categoryLabel(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    filterCategory === cat
                      ? "bg-accent/20 border-accent/50 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredRecs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune recommandation pour ces filtres.</p>
        ) : (
          filteredRecs.map(rec => (
            <div key={rec.id} className="relative">
              {appliedRecs.includes(rec.id) && (
                <div className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center z-10 pointer-events-none">
                  <div className="flex items-center gap-2 bg-emerald-500/20 rounded-full px-4 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Ajustement appliqué</span>
                  </div>
                </div>
              )}
              <RecCard rec={rec} onApply={handleApply} />
            </div>
          ))
        )}
      </div>

      {/* ── Notes contextuelles ── */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">Analyse contextuelle KENENERGIE</h3>
        </div>
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div key={i} className="flex gap-2.5 text-xs text-muted-foreground">
              <span className="text-accent font-bold flex-shrink-0">▸</span>
              <span className="leading-relaxed">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roadmap synthétique ── */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">Feuille de Route — Plan d'action</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["immédiat", "court terme", "moyen terme"] as const).map((effort, idx) => {
            const recs = recommandations.filter(r => r.effort === effort);
            const colors = [
              "border-red-500/30 bg-red-500/5",
              "border-amber-400/30 bg-amber-400/5",
              "border-blue-400/30 bg-blue-400/5",
            ];
            const textColors = ["text-red-400", "text-amber-300", "text-blue-400"];
            const icons = [AlertOctagon, AlertTriangle, Info];
            const Icon = icons[idx];
            return (
              <div key={effort} className={`rounded-xl border p-4 ${colors[idx]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${textColors[idx]}`} />
                  <span className={`text-xs font-bold capitalize ${textColors[idx]}`}>{effort}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{recs.length} action{recs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {recs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Aucune action requise</p>
                  ) : recs.map(r => (
                    <div key={r.id} className="flex gap-2 text-xs">
                      <span className="text-accent flex-shrink-0">•</span>
                      <span className="text-muted-foreground leading-relaxed">{r.titre}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => navigate("/parametres")}>
          <Sliders className="w-4 h-4" /> Modifier les paramètres
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => navigate("/alertes-bancaires")}>
          <BarChart3 className="w-4 h-4" /> Voir les alertes bancaires
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => navigate("/covenants")}>
          <ShieldCheck className="w-4 h-4" /> Vérifier les covenants
        </Button>
        {activeDossier && (
          <p className="text-xs text-muted-foreground self-center">
            Dossier actif : <span className="text-accent font-medium">{activeDossier.nom}</span>
            {" — Les ajustements appliqués modifient les paramètres en mémoire (non sauvegardés automatiquement)."}
          </p>
        )}
      </div>
    </div>
  );
}
