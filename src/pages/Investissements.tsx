import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RotateCcw, Pencil, Eye, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useState } from "react";

// ── Sequencing presets ──────────────────────────────────────────────────────
type SeqPreset = "equal" | "frontload" | "phases" | "progressive" | "year1" | "custom";

interface Preset { id: SeqPreset; label: string; pcts: [number, number, number, number, number] }
const PRESETS: Preset[] = [
  { id: "equal",       label: "Égale",          pcts: [20,  20,  20,  20,  20]  },
  { id: "frontload",   label: "Front-heavy",     pcts: [40,  30,  20,  10,   0]  },
  { id: "phases",      label: "Phases N/N+2/N+4",pcts: [40,   0,  40,   0,  20]  },
  { id: "progressive", label: "Progressif",      pcts: [10,  20,  30,  40,   0]  },
  { id: "year1",       label: "Année 1 seule",   pcts: [100,  0,   0,   0,   0]  },
];

// ── Derive active preset id from pcts ──────────────────────────────────────
function detectPreset(pcts: number[]): SeqPreset {
  for (const p of PRESETS) {
    if (p.pcts.every((v, i) => Math.abs(v - pcts[i]) < 0.5)) return p.id;
  }
  return "custom";
}

export default function Investissements() {
  const { investData, updateInvEntry, addInvEntry, removeInvEntry, resetInvest, computed } = useParametres();
  const { planFinancement, vanTirMetrics } = computed;
  const [editMode, setEditMode] = useState(false);
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);

  // ── Live totals ──
  const investAnTotals: number[] = [0, 0, 0, 0, 0];
  investData.forEach(inv => inv.an.forEach((v, i) => { investAnTotals[i] += v; }));
  const investGlobal = investData.reduce((s, inv) => s + inv.global, 0);

  // ── Apply sequencing preset to an entry ──
  const applySeq = (idx: number, pcts: [number, number, number, number, number]) => {
    const global = investData[idx].global;
    let remaining = global;
    for (let i = 0; i < 4; i++) {
      const v = Math.round(global * pcts[i] / 100);
      updateInvEntry(idx, i, v);
      remaining -= v;
    }
    updateInvEntry(idx, 4, Math.max(0, remaining));
  };

  // ── Derive % from an entry's current values ──
  const getPcts = (inv: typeof investData[0]): [number, number, number, number, number] => {
    const total = inv.an.reduce((s, v) => s + v, 0);
    if (total === 0) return [0, 0, 0, 0, 0];
    return inv.an.map(v => parseFloat(((v / total) * 100).toFixed(1))) as [number, number, number, number, number];
  };

  // ── Read-only table ──
  const cols = [
    { key: "intitule", label: "Intitulé",       align: "left"  as const },
    { key: "global",   label: "Valeur Globale", align: "right" as const },
    ...YEARS.map((y, i) => ({ key: `a${i}`, label: y.toString(), align: "right" as const })),
  ];
  const rows: any[] = investData.map(inv => ({
    intitule: inv.intitule,
    global: formatFcfa(inv.global),
    a0: inv.an[0] ? formatFcfa(inv.an[0]) : "—",
    a1: inv.an[1] ? formatFcfa(inv.an[1]) : "—",
    a2: inv.an[2] ? formatFcfa(inv.an[2]) : "—",
    a3: inv.an[3] ? formatFcfa(inv.an[3]) : "—",
    a4: inv.an[4] ? formatFcfa(inv.an[4]) : "—",
    _sub: true,
  }));
  rows.push({
    intitule: "TOTAL INVESTISSEMENTS",
    global: formatFcfa(investGlobal),
    a0: investAnTotals[0] ? formatFcfa(investAnTotals[0]) : "—",
    a1: investAnTotals[1] ? formatFcfa(investAnTotals[1]) : "—",
    a2: investAnTotals[2] ? formatFcfa(investAnTotals[2]) : "—",
    a3: investAnTotals[3] ? formatFcfa(investAnTotals[3]) : "—",
    a4: investAnTotals[4] ? formatFcfa(investAnTotals[4]) : "—",
    _total: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Plan des Investissements" subtitle="Répartition des immobilisations sur 5 ans"
          aiPrompt="Analyse le plan d'investissement : allocation par poste, cohérence avec l'activité, risques de dépassement ?" />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={editMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setEditMode(v => !v)}
          >
            {editMode ? <><Eye className="h-3.5 w-3.5" /> Voir tableau</> : <><Pencil className="h-3.5 w-3.5" /> Modifier montants</>}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={resetInvest}>
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-primary-foreground/70 mb-1">Total global</p>
          <p className="text-lg font-bold font-mono">{formatFcfa(investGlobal, true)}</p>
        </div>
        {YEARS.map((y, i) => (
          <div key={y} className="kpi-depth rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Invest. {y}</p>
            <p className="text-sm font-bold font-mono text-foreground">
              {investAnTotals[i] ? formatFcfa(investAnTotals[i], true) : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Summary panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-depth rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Structure de financement</p>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Capital social</span><span className="font-mono">{formatFcfa(planFinancement[2027]?.capitalSocial ?? 10_000_000)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">C/C Associés</span><span className="font-mono">{formatFcfa(planFinancement[2027]?.comptesCourantsAssocies ?? 1_000_000_000)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Emprunt LT</span><span className="font-mono">{formatFcfa(planFinancement[2027]?.empruntsLT ?? 5_000_000_000)}</span></div>
          </div>
        </div>
        <div className="kpi-depth rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Indicateurs projet</p>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">TIR calculé</span><span className="font-mono font-semibold text-accent">{(vanTirMetrics.irr * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAN (10%)</span><span className="font-mono font-semibold text-positive">{formatFcfa(vanTirMetrics.van10, true)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Délai retour</span><span className="font-mono">{isNaN(vanTirMetrics.paybackYears) ? "> 5 ans" : vanTirMetrics.paybackYears.toFixed(1) + " ans"}</span></div>
          </div>
        </div>
        <div className="kpi-depth rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Répartition programme N (40%)</p>
          <div className="space-y-1.5 mt-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Année 1 (2027)</span><span className="font-mono font-semibold">{formatFcfa(investAnTotals[0], true)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Année 3 (2029)</span><span className="font-mono font-semibold">{formatFcfa(investAnTotals[2], true)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Année 5 (2031)</span><span className="font-mono font-semibold">{formatFcfa(investAnTotals[4], true)}</span></div>
          </div>
        </div>
      </div>

      {/* Edit mode table */}
      {editMode ? (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-primary-foreground font-semibold text-sm">Modifier les Investissements</h2>
              <p className="text-primary-foreground/60 text-xs mt-0.5">
                Cliquez sur <span className="font-semibold text-primary-foreground/80">Séquencer</span> pour distribuer un investissement selon des contraintes projet
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addInvEntry} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Ajouter ligne
            </Button>
          </div>

          <div className="divide-y divide-border/60">
            {investData.map((inv, idx) => {
              const pcts = getPcts(inv);
              const sumAn = inv.an.reduce((s, v) => s + v, 0);
              const pctSum = pcts.reduce((s, v) => s + v, 0);
              const pctOk = Math.abs(pctSum - 100) < 1 || sumAn === 0;
              const activePreset = detectPreset(pcts);
              const isExpanded = expandedSeq === idx;

              return (
                <div key={idx}>
                  {/* Main edit row */}
                  <div className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/10 transition-colors">
                    {/* Intitulé */}
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        value={inv.intitule}
                        onChange={e => updateInvEntry(idx, "intitule", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    {/* Global */}
                    <div className="w-36 flex-shrink-0">
                      <Input
                        type="number"
                        step="1000000"
                        value={inv.global}
                        onChange={e => updateInvEntry(idx, "global", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm text-right font-mono"
                      />
                    </div>
                    {/* Annual amounts */}
                    {inv.an.map((v, yi) => (
                      <div key={yi} className="w-28 flex-shrink-0">
                        <Input
                          type="number"
                          step="1000000"
                          value={v}
                          onChange={e => updateInvEntry(idx, yi, parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm text-right font-mono"
                        />
                      </div>
                    ))}
                    {/* Séquencer toggle + delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedSeq(isExpanded ? null : idx)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          isExpanded ? "bg-accent text-white" : "bg-accent/10 text-accent hover:bg-accent/20"
                        }`}
                      >
                        Séquencer
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvEntry(idx)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* ── Sequencing panel ── */}
                  {isExpanded && (
                    <div className="mx-3 mb-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Séquencement de l'investissement — <span className="font-mono text-primary">{inv.intitule}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Montant global : <span className="font-mono font-semibold">{formatFcfa(inv.global)}</span>
                          </p>
                        </div>
                        {!pctOk && (
                          <div className="flex items-center gap-1 text-warning text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Somme = {pctSum.toFixed(1)}% (≠ 100%)</span>
                          </div>
                        )}
                      </div>

                      {/* Preset buttons */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {PRESETS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applySeq(idx, p.pcts)}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                              activePreset === p.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                        <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${
                          activePreset === "custom" ? "bg-warning/20 text-warning" : "hidden"
                        }`}>
                          Personnalisé
                        </span>
                      </div>

                      {/* % inputs per year */}
                      <div className="grid grid-cols-5 gap-2">
                        {YEARS.map((y, yi) => {
                          const pct = pcts[yi];
                          return (
                            <div key={y} className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-1 font-medium">{y}</p>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="5"
                                  min="0"
                                  max="100"
                                  value={pct}
                                  onChange={e => {
                                    const newPct = parseFloat(e.target.value) || 0;
                                    const newVal = Math.round(inv.global * newPct / 100);
                                    updateInvEntry(idx, yi, newVal);
                                  }}
                                  className="h-8 text-sm text-center font-mono pr-5"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                              </div>
                              {/* Progress bar */}
                              <progress
                                value={Math.min(100, pct)}
                                max={100}
                                className="mt-1.5 w-full h-1.5 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-muted/40 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-accent [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-accent"
                              />
                              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                                {formatFcfa(inv.an[yi], true)}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Sum bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <progress
                          value={Math.min(100, pctSum)}
                          max={100}
                          className={`flex-1 h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-muted/40 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full ${
                            pctOk
                              ? "[&::-webkit-progress-value]:bg-[hsl(142,60%,35%)] [&::-moz-progress-bar]:bg-[hsl(142,60%,35%)]"
                              : "[&::-webkit-progress-value]:bg-[hsl(38,85%,50%)] [&::-moz-progress-bar]:bg-[hsl(38,85%,50%)]"
                          }`}
                        />
                        <span className={`text-[11px] font-mono font-semibold ${pctOk ? "text-positive" : "text-warning"}`}>
                          {pctSum.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Column headers (sticky-like row above inputs) */}
          </div>

          {/* Totals row */}
          <div className="bg-primary/5 font-semibold border-t-2 border-primary/20 px-3 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="flex-1 min-w-[160px] text-xs text-foreground">TOTAL</span>
            <span className="w-36 flex-shrink-0 text-right font-mono text-sm text-primary">{formatFcfa(investGlobal)}</span>
            {investAnTotals.map((t, i) => (
              <span key={i} className="w-28 flex-shrink-0 text-right font-mono text-sm text-primary">{t ? formatFcfa(t) : "—"}</span>
            ))}
            <span className="w-24 flex-shrink-0" />
          </div>

          <div className="px-5 py-3 bg-muted/20 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Séquencement :</span> Répartissez chaque investissement selon les contraintes du projet (phases de travaux, disponibilités, saisons). La VAN, le TIR et le bilan se recalculent automatiquement.
            </p>
          </div>
        </div>
      ) : (
        /* Read-only FinTable */
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3">
            <h2 className="text-primary-foreground font-semibold text-sm">Plan d'Investissements Détaillé</h2>
          </div>
          <FinTable cols={cols} rows={rows} compact exportName="Investissements" />
        </div>
      )}
    </div>
  );
}
