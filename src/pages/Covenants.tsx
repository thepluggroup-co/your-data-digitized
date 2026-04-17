import PageHeader from "@/components/kenenergie/PageHeader";
import { useParametres } from "@/contexts/ParametresContext";
import { YEARS } from "@/lib/kenenergie-data";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type CovenantStatus = "compliant" | "watch" | "breach";

interface CovenantDef {
  id: string;
  label: string;
  description: string;
  norme: string;
  categorie: "liquidite" | "solvabilite" | "rentabilite" | "remboursement";
}

const COVENANTS: CovenantDef[] = [
  {
    id: "CV1",
    label: "DSCR Minimum",
    description: "Ratio de couverture du service de la dette (EBE / Service de la dette)",
    norme: "≥ 1,20×",
    categorie: "remboursement",
  },
  {
    id: "CV2",
    label: "Ratio d'Autonomie Financière",
    description: "Part des capitaux propres dans le total du bilan",
    norme: "≥ 20%",
    categorie: "solvabilite",
  },
  {
    id: "CV3",
    label: "Levier Financier Maximum",
    description: "Endettement net rapporté à l'EBITDA",
    norme: "≤ 5,0×",
    categorie: "solvabilite",
  },
  {
    id: "CV4",
    label: "Interest Coverage Ratio (ICR)",
    description: "Bénéfice d'exploitation / Frais financiers",
    norme: "≥ 2,5×",
    categorie: "remboursement",
  },
  {
    id: "CV5",
    label: "Liquidité Générale",
    description: "Actifs circulants / Passifs circulants",
    norme: "≥ 1,0×",
    categorie: "liquidite",
  },
  {
    id: "CV6",
    label: "Fonds de Roulement Net Positif",
    description: "FRN = (Capitaux propres + Dettes LT) − Actif immobilisé",
    norme: "≥ 0",
    categorie: "liquidite",
  },
  {
    id: "CV7",
    label: "Résultat Net Positif",
    description: "Absence de perte nette sur l'exercice",
    norme: "> 0 FCFA",
    categorie: "rentabilite",
  },
  {
    id: "CV8",
    label: "CAF / Dettes LT",
    description: "Capacité à rembourser les dettes par la CAF en moins de 7 ans",
    norme: "≤ 7 ans",
    categorie: "remboursement",
  },
];

const CATEGORIE_LABELS: Record<string, string> = {
  liquidite: "Liquidité",
  solvabilite: "Solvabilité",
  rentabilite: "Rentabilité",
  remboursement: "Remboursement",
};

// ── Compute per-year covenant value & status ──────────────────────────────────
function computeCovenantYear(
  cv: CovenantDef,
  y: number,
  computed: ReturnType<typeof useParametres>["computed"],
): { value: number; display: string; status: CovenantStatus } {
  const { resultats, bilan, banking, vanTirMetrics } = computed;
  const b = bilan[y];
  const r = resultats[y];
  const bk = banking[y];

  let value = 0;
  let display = "";
  let status: CovenantStatus = "compliant";

  switch (cv.id) {
    case "CV1": {
      value = bk.dscrEbe;
      display = value.toFixed(2) + "×";
      status = value >= 1.3 ? "compliant" : value >= 1.2 ? "watch" : "breach";
      break;
    }
    case "CV2": {
      value = bk.autonomie * 100;
      display = value.toFixed(1) + "%";
      status = value >= 25 ? "compliant" : value >= 20 ? "watch" : "breach";
      break;
    }
    case "CV3": {
      value = vanTirMetrics.levier[y];
      display = value.toFixed(2) + "×";
      status = value <= 3 ? "compliant" : value <= 5 ? "watch" : "breach";
      break;
    }
    case "CV4": {
      value = vanTirMetrics.icr[y] ?? 0;
      display = value.toFixed(2) + "×";
      status = value >= 4 ? "compliant" : value >= 2.5 ? "watch" : "breach";
      break;
    }
    case "CV5": {
      value = vanTirMetrics.liquidite[y];
      display = value.toFixed(2) + "×";
      status = value >= 1.5 ? "compliant" : value >= 1.0 ? "watch" : "breach";
      break;
    }
    case "CV6": {
      value = bk.frn;
      display = (value / 1e9).toFixed(3) + " Mds";
      status = value >= 0 ? "compliant" : "breach";
      break;
    }
    case "CV7": {
      value = r.beneficeNet;
      display = (value / 1e9).toFixed(3) + " Mds";
      status = value > 0 ? "compliant" : "breach";
      break;
    }
    case "CV8": {
      value = bk.dettesCaf;
      display = value.toFixed(2) + " ans";
      status = value <= 4 ? "compliant" : value <= 7 ? "watch" : "breach";
      break;
    }
  }
  return { value, display, status };
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function statusIcon(s: CovenantStatus) {
  if (s === "compliant") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (s === "watch")     return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400" />;
}
function statusCls(s: CovenantStatus) {
  if (s === "compliant") return "text-emerald-400";
  if (s === "watch")     return "text-amber-300";
  return "text-red-400";
}
function statusBg(s: CovenantStatus) {
  if (s === "compliant") return "bg-emerald-500/10 border-emerald-500/20";
  if (s === "watch")     return "bg-amber-400/10 border-amber-400/20";
  return "bg-red-500/10 border-red-500/20";
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Covenants() {
  const { computed } = useParametres();

  // Build grid: covenant × year → result
  const grid = COVENANTS.map(cv => ({
    ...cv,
    years: YEARS.map(y => ({ year: y, ...computeCovenantYear(cv, y, computed) })),
  }));

  // Summary stats
  const allCells = grid.flatMap(r => r.years);
  const nbCompliant = allCells.filter(c => c.status === "compliant").length;
  const nbWatch     = allCells.filter(c => c.status === "watch").length;
  const nbBreach    = allCells.filter(c => c.status === "breach").length;

  // Per-year breach count
  const yearBreaches = YEARS.map(y => ({
    year: y,
    breaches: grid.filter(r => r.years.find(c => c.year === y)?.status === "breach").length,
    watches:  grid.filter(r => r.years.find(c => c.year === y)?.status === "watch").length,
  }));

  // Group by category
  const categories = ["liquidite", "solvabilite", "rentabilite", "remboursement"] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Covenants Bancaires"
        subtitle="Surveillance des 8 engagements financiers (CV1–CV8) par année"
        badge="8 covenants"
      />

      {/* Summary */}
      <div className="kpi-primary-depth rounded-xl px-5 py-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-3xl font-bold text-emerald-400">{nbCompliant}</p>
          <p className="text-white/60 text-xs mt-0.5">Conformes</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-3xl font-bold text-amber-300">{nbWatch}</p>
          <p className="text-white/60 text-xs mt-0.5">À surveiller</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-400">{nbBreach}</p>
          <p className="text-white/60 text-xs mt-0.5">Violations</p>
        </div>
      </div>

      {/* Per-year status */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Statut par Année</h3>
        <div className="grid grid-cols-5 gap-3">
          {yearBreaches.map(({ year, breaches, watches }) => {
            const overall: CovenantStatus = breaches > 0 ? "breach" : watches > 0 ? "watch" : "compliant";
            return (
              <div key={year} className={`rounded-xl border p-4 text-center ${statusBg(overall)}`}>
                <p className="text-xs text-muted-foreground mb-1">{year}</p>
                <div className="flex justify-center mb-2">{statusIcon(overall)}</div>
                <p className={`text-lg font-bold ${statusCls(overall)}`}>
                  {breaches > 0 ? breaches : watches > 0 ? watches : "✓"}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {breaches > 0 ? `${breaches} violation${breaches > 1 ? "s" : ""}` :
                   watches > 0 ? `${watches} alerte${watches > 1 ? "s" : ""}` : "Conforme"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main grid */}
      <div className="kpi-depth rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Tableau des Covenants — Détail par Année</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="header-gradient text-white/80">
                <th className="text-left px-4 py-2.5 font-semibold w-8">ID</th>
                <th className="text-left px-4 py-2.5 font-semibold">Covenant</th>
                <th className="text-center px-3 py-2.5 font-semibold">Norme</th>
                {YEARS.map(y => (
                  <th key={y} className="text-center px-3 py-2.5 font-semibold">{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const rows = grid.filter(r => r.categorie === cat);
                return (
                  <>
                    <tr key={`cat-${cat}`} className="bg-muted/20">
                      <td colSpan={3 + YEARS.length} className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {CATEGORIE_LABELS[cat]}
                      </td>
                    </tr>
                    {rows.map(row => (
                      <tr key={row.id} className="row-lift border-b border-border/40 last:border-0">
                        <td className="px-4 py-2.5 font-mono font-bold text-accent">{row.id}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-foreground">{row.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{row.description}</p>
                        </td>
                        <td className="text-center px-3 py-2.5 font-mono text-muted-foreground">{row.norme}</td>
                        {row.years.map(({ year, display, status }) => (
                          <td key={year} className="text-center px-3 py-2.5">
                            <div className={`flex items-center justify-center gap-1 font-mono font-semibold ${statusCls(status)}`}>
                              {statusIcon(status)}
                              {display}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recap table */}
      <div className="kpi-depth rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Récapitulatif — Statut Global par Covenant</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {grid.map(row => {
            const overall: CovenantStatus =
              row.years.some(c => c.status === "breach") ? "breach" :
              row.years.some(c => c.status === "watch")  ? "watch"  : "compliant";
            const nbOk   = row.years.filter(c => c.status === "compliant").length;
            const nbFail = row.years.filter(c => c.status === "breach").length;
            return (
              <div key={row.id} className={`rounded-xl border p-3 ${statusBg(overall)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-accent">{row.id}</span>
                  {statusIcon(overall)}
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight mb-2">{row.label}</p>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-emerald-400">{nbOk}×✓</span>
                  {nbFail > 0 && <span className="text-red-400">{nbFail}×✗</span>}
                </div>
                <p className={`text-[10px] mt-1 font-semibold ${statusCls(overall)}`}>
                  {overall === "compliant" ? "Toujours conforme" :
                   overall === "watch"     ? "Surveillance requise" :
                                             `${nbFail} violation${nbFail > 1 ? "s" : ""}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology */}
      <div className="kpi-depth rounded-xl border border-border px-5 py-4 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-accent" />
          <span className="font-semibold text-foreground text-sm">Note méthodologique</span>
        </div>
        <p>• Les seuils de covenants sont définis selon les pratiques standard des banques commerciales opérant dans la zone CEMAC/UEMOA</p>
        <p>• CV1 (DSCR) : calculé sur base EBE pour neutraliser les effets comptables de l'amortissement</p>
        <p>• CV3 (Levier) : endettement rapporté à l'EBITDA — un ratio ≤ 3× est considéré sain, ≤ 5× tolérable</p>
        <p>• CV8 (CAF / Dettes LT) : mesure la durée théorique de remboursement par la seule capacité d'autofinancement</p>
        <p>• Une violation de covenant n'implique pas automatiquement un défaut — elle déclenche une clause de revue avec la banque (waiver)</p>
      </div>
    </div>
  );
}
