import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RotateCcw, Pencil, Eye, Calculator } from "lucide-react";
import { useState } from "react";

export default function Amortissements() {
  const { amortData, updateAmortEntry, addAmortEntry, removeAmortEntry, resetAmort } = useParametres();
  const [editMode, setEditMode] = useState(false);

  // ── Derive per-year totals & grand totals ──
  const amortParAnnee: number[] = [0, 0, 0, 0, 0];
  amortData.forEach(a => a.annees.forEach((v, i) => { amortParAnnee[i] += v; }));
  const totalValeur = amortData.filter(a => !a.isSubLine).reduce((s, a) => s + a.valeurTotale, 0);
  const totalAmt = amortData.reduce((s, a) => s + a.annees.reduce((ss, v) => ss + v, 0), 0);
  const totalVnc = totalValeur - totalAmt;

  // ── Auto-compute annees from valeurTotale * taux (flat) helper ──
  const autoFill = (idx: number) => {
    const entry = amortData[idx];
    if (!entry || entry.taux <= 0) return;
    for (let i = 0; i < 5; i++) {
      updateAmortEntry(idx, i, Math.round(entry.valeurTotale * entry.taux));
    }
  };

  // ── Read-only table cols / rows ──
  const cols = [
    { key: "intitule",     label: "Intitulé",        align: "left"  as const },
    { key: "valeurTotale", label: "Valeur Totale",    align: "right" as const },
    { key: "taux",         label: "Taux",             align: "right" as const },
    ...YEARS.map((y, i) => ({ key: `a${i}`, label: y.toString(), align: "right" as const })),
    { key: "amt",          label: "Amort. Cumulé",    align: "right" as const },
    { key: "vnc",          label: "VNC",              align: "right" as const },
  ];

  const rows: any[] = amortData.map(a => {
    const amt = a.annees.reduce((s, v) => s + v, 0);
    const vnc = a.valeurTotale - amt;
    return {
      intitule: a.intitule,
      valeurTotale: formatFcfa(a.valeurTotale),
      taux: a.taux > 0 ? (a.taux * 100).toFixed(0) + "%" : "—",
      a0: a.annees[0] ? formatFcfa(a.annees[0]) : "—",
      a1: a.annees[1] ? formatFcfa(a.annees[1]) : "—",
      a2: a.annees[2] ? formatFcfa(a.annees[2]) : "—",
      a3: a.annees[3] ? formatFcfa(a.annees[3]) : "—",
      a4: a.annees[4] ? formatFcfa(a.annees[4]) : "—",
      amt: formatFcfa(amt),
      vnc: formatFcfa(vnc),
      _sub: a.isSubLine,
    };
  });

  rows.push({
    intitule: "TOTAL AMORTISSEMENT",
    valeurTotale: formatFcfa(totalValeur),
    taux: "",
    a0: formatFcfa(amortParAnnee[0]),
    a1: formatFcfa(amortParAnnee[1]),
    a2: formatFcfa(amortParAnnee[2]),
    a3: formatFcfa(amortParAnnee[3]),
    a4: formatFcfa(amortParAnnee[4]),
    amt: formatFcfa(totalAmt),
    vnc: formatFcfa(totalVnc),
    _total: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Tableau des Amortissements"
          subtitle="Dotations annuelles par catégorie d'immobilisation (2027–2031)"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={editMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setEditMode(v => !v)}
          >
            {editMode
              ? <><Eye className="h-3.5 w-3.5" /> Voir tableau</>
              : <><Pencil className="h-3.5 w-3.5" /> Modifier dotations</>
            }
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={resetAmort}>
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
        <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-primary-foreground/70 mb-1">Valeur totale</p>
          <p className="text-base font-bold font-mono">{formatFcfa(totalValeur, true)}</p>
        </div>
        {YEARS.map((y, i) => (
          <div key={y} className="kpi-depth rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Dotation {y}</p>
            <p className="text-sm font-bold font-mono text-primary">{formatFcfa(amortParAnnee[i], true)}</p>
          </div>
        ))}
        <div className="kpi-depth rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Amort. Cumulé</p>
          <p className="text-sm font-bold font-mono text-accent">{formatFcfa(totalAmt, true)}</p>
        </div>
        <div className="kpi-depth rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">VNC finale</p>
          <p className="text-sm font-bold font-mono text-positive">{formatFcfa(totalVnc, true)}</p>
        </div>
      </div>

      {editMode ? (
        /* ── Edit mode ── */
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-primary-foreground font-semibold text-sm">Modifier les Amortissements</h2>
              <p className="text-primary-foreground/60 text-xs mt-0.5">
                Modifiez les dotations par année — la CAF et le bilan se recalculent automatiquement
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addAmortEntry} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Ajouter ligne
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground min-w-[200px]">Intitulé</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-32">Valeur (FCFA)</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-20">Taux %</th>
                  {YEARS.map(y => (
                    <th key={y} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-32">{y}</th>
                  ))}
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28">Amt Cumulé</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28">VNC</th>
                  <th className="px-3 py-2 w-16 sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {amortData.map((a, idx) => {
                  const amt = a.annees.reduce((s, v) => s + v, 0);
                  const vnc = a.valeurTotale - amt;
                  return (
                    <tr
                      key={idx}
                      className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${a.isSubLine ? "bg-muted/20" : ""}`}
                    >
                      {/* Intitulé */}
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          {a.isSubLine && <span className="text-muted-foreground/40 text-xs">↳</span>}
                          <Input
                            value={a.intitule.trimStart()}
                            onChange={e => updateAmortEntry(idx, "intitule", (a.isSubLine ? "  " : "") + e.target.value)}
                            className="h-8 text-sm min-w-[170px]"
                          />
                        </div>
                      </td>
                      {/* Valeur */}
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          step="1000000"
                          value={a.valeurTotale}
                          onChange={e => updateAmortEntry(idx, "valeurTotale", parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm text-right font-mono w-32 ml-auto"
                        />
                      </td>
                      {/* Taux % */}
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="5"
                            min="0"
                            max="100"
                            value={(a.taux * 100).toFixed(0)}
                            onChange={e => updateAmortEntry(idx, "taux", (parseFloat(e.target.value) || 0) / 100)}
                            className="h-8 text-sm text-right font-mono w-16 ml-auto"
                          />
                          <button
                            type="button"
                            onClick={() => autoFill(idx)}
                            title="Auto-calculer dotations = valeur × taux"
                            className="p-1.5 rounded hover:bg-accent/20 text-accent flex-shrink-0"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      {/* Années */}
                      {a.annees.map((v, yi) => (
                        <td key={yi} className="px-3 py-1.5">
                          <Input
                            type="number"
                            step="1000000"
                            value={v}
                            onChange={e => updateAmortEntry(idx, yi, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right font-mono w-32 ml-auto"
                          />
                        </td>
                      ))}
                      {/* Amt cumulé + VNC (read-only) */}
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatFcfa(amt)}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono text-xs whitespace-nowrap ${vnc < 0 ? "text-destructive" : "text-positive"}`}>
                        {formatFcfa(vnc)}
                      </td>
                      {/* Delete */}
                      <td className="px-2 py-1.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAmortEntry(idx)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                <tr className="bg-primary/5 font-semibold border-t-2 border-primary/20">
                  <td className="px-3 py-2 text-xs text-foreground">TOTAL</td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-primary">{formatFcfa(totalValeur)}</td>
                  <td></td>
                  {amortParAnnee.map((t, i) => (
                    <td key={i} className="px-3 py-2 text-right font-mono text-sm text-primary">{formatFcfa(t)}</td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono text-sm text-accent">{formatFcfa(totalAmt)}</td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-positive">{formatFcfa(totalVnc)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-muted/20 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Astuce :</span> Saisissez le taux et cliquez{" "}
              <Calculator className="w-3 h-3 inline text-accent" />{" "}
              pour auto-remplir les dotations annuelles (valeur × taux). Les dotations impactent la CAF et le résultat en temps réel.
            </p>
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3">
            <h2 className="text-primary-foreground font-semibold text-sm">Plan d'amortissement détaillé</h2>
          </div>
          <FinTable cols={cols} rows={rows} compact exportName="Amortissements" />
        </div>
      )}
    </div>
  );
}
