import PageHeader from "@/components/kenenergie/PageHeader";
import { useParametres } from "@/contexts/ParametresContext";
import { formatFcfa, YEARS } from "@/lib/kenenergie-data";

// ── Traffic-light helper ──────────────────────────────────────────────────────
type Status = "good" | "warn" | "bad";
function statusDot(s: Status) {
  const cls = s === "good" ? "bg-emerald-500" : s === "warn" ? "bg-amber-400" : "bg-red-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${cls}`} />;
}
function statusBadge(s: Status) {
  const [cls, label] =
    s === "good" ? ["bg-emerald-500/15 text-emerald-400 border-emerald-500/30", "Satisfaisant"] :
    s === "warn" ? ["bg-amber-400/15 text-amber-300 border-amber-400/30", "À surveiller"] :
                   ["bg-red-500/15 text-red-400 border-red-500/30", "Alerte"];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

interface AlertRow {
  indicateur: string;
  valeurs: (string | number)[];
  statuts: Status[];
  norme: string;
}

function SectionCard({ title, subtitle, rows, years }: {
  title: string;
  subtitle: string;
  rows: AlertRow[];
  years: number[];
}) {
  const overall = rows.some(r => r.statuts.some(s => s === "bad")) ? "bad"
    : rows.some(r => r.statuts.some(s => s === "warn")) ? "warn" : "good";

  return (
    <div className="kpi-depth rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {statusDot(overall)}
          <div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {statusBadge(overall)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="header-gradient text-white/80">
              <th className="text-left px-4 py-2.5 font-semibold w-[220px]">Indicateur</th>
              {years.map(y => (
                <th key={y} className="text-right px-3 py-2.5 font-semibold">{y}</th>
              ))}
              <th className="text-right px-4 py-2.5 font-semibold">Norme</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="row-lift border-b border-border/50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{row.indicateur}</td>
                {row.valeurs.map((v, vi) => {
                  const s = row.statuts[vi];
                  const txtCls = s === "good" ? "text-emerald-400" : s === "warn" ? "text-amber-300" : "text-red-400";
                  return (
                    <td key={vi} className={`text-right px-3 py-2.5 font-mono font-semibold ${txtCls}`}>
                      <span className="flex items-center justify-end gap-1.5">
                        {statusDot(s)} {v}
                      </span>
                    </td>
                  );
                })}
                <td className="text-right px-4 py-2.5 text-muted-foreground italic">{row.norme}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlertesBancaires() {
  const { computed } = useParametres();
  const { resultats, bilan, chargesExploitation, banking } = computed;

  const pct = (v: number) => `${v.toFixed(1)}%`;
  const ratio = (v: number) => v.toFixed(2);
  const mds = (v: number) => `${(v / 1e9).toFixed(3)} Mds`;

  // ── SECTION A : Équilibre du bilan ─────────────────────────────────────────
  const rowsFRN: AlertRow = {
    indicateur: "Fonds de Roulement Net (FRN)",
    valeurs: YEARS.map(y => mds(banking[y].frn)),
    statuts: YEARS.map(y => banking[y].frn >= 0 ? "good" : "bad"),
    norme: "≥ 0",
  };
  const rowsTresoNette: AlertRow = {
    indicateur: "Trésorerie Nette",
    valeurs: YEARS.map(y => mds(banking[y].tresoNette)),
    statuts: YEARS.map(y => banking[y].tresoNette >= 0 ? "good" : banking[y].tresoNette >= -200e6 ? "warn" : "bad"),
    norme: "≥ 0",
  };
  const rowsActifImmo: AlertRow = {
    indicateur: "Actif Immobilisé",
    valeurs: YEARS.map(y => mds(bilan[y].actifImmo)),
    statuts: YEARS.map(() => "good"),
    norme: "Information",
  };
  const rowsTotalActif: AlertRow = {
    indicateur: "Total Actif / Passif",
    valeurs: YEARS.map(y => mds(bilan[y].totalActif)),
    statuts: YEARS.map(y => banking[y].ecartBilan < 1 ? "good" : banking[y].ecartBilan < 1000 ? "warn" : "bad"),
    norme: "Actif = Passif",
  };
  const sectionA = [rowsFRN, rowsTresoNette, rowsActifImmo, rowsTotalActif];

  // ── SECTION B : CEP — Rentabilité ─────────────────────────────────────────
  const rowsCAGrowth: AlertRow = {
    indicateur: "Croissance CA (%)",
    valeurs: YEARS.map((y, i) => i === 0 ? "—" : pct(banking[y].croissanceCA)),
    statuts: YEARS.map((y, i) => {
      if (i === 0) return "good";
      return banking[y].croissanceCA >= 10 ? "good" : banking[y].croissanceCA >= 0 ? "warn" : "bad";
    }),
    norme: "≥ 10% p.a.",
  };
  const rowsMargeBrute: AlertRow = {
    indicateur: "Marge EBE / CA (%)",
    valeurs: YEARS.map(y => pct(banking[y].margeEbe)),
    statuts: YEARS.map(y => banking[y].margeEbe >= 20 ? "good" : banking[y].margeEbe >= 10 ? "warn" : "bad"),
    norme: "≥ 20%",
  };
  const rowsMargeVA: AlertRow = {
    indicateur: "Valeur Ajoutée / CA (%)",
    valeurs: YEARS.map(y => pct(banking[y].margeVa)),
    statuts: YEARS.map(y => banking[y].margeVa >= 40 ? "good" : banking[y].margeVa >= 25 ? "warn" : "bad"),
    norme: "≥ 40%",
  };
  const rowsResultatNet: AlertRow = {
    indicateur: "Résultat Net / CA (%)",
    valeurs: YEARS.map(y => pct(resultats[y].resultatNetVentes)),
    statuts: YEARS.map(y => resultats[y].resultatNetVentes >= 10 ? "good" : resultats[y].resultatNetVentes >= 5 ? "warn" : "bad"),
    norme: "≥ 10%",
  };
  const rowsROA: AlertRow = {
    indicateur: "ROA — Rentabilité Actifs (%)",
    valeurs: YEARS.map(y => pct(banking[y].roa)),
    statuts: YEARS.map(y => banking[y].roa >= 5 ? "good" : banking[y].roa >= 2 ? "warn" : "bad"),
    norme: "≥ 5%",
  };
  const sectionB = [rowsCAGrowth, rowsMargeBrute, rowsMargeVA, rowsResultatNet, rowsROA];

  // ── SECTION C : DSCR / Solvabilité ────────────────────────────────────────
  const rowsDSCR: AlertRow = {
    indicateur: "DSCR (EBE / Service de la dette)",
    valeurs: YEARS.map(y => ratio(banking[y].dscrEbe)),
    statuts: YEARS.map(y => banking[y].dscrEbe >= 1.3 ? "good" : banking[y].dscrEbe >= 1.0 ? "warn" : "bad"),
    norme: "≥ 1,3×",
  };
  const rowsICR: AlertRow = {
    indicateur: "ICR (Bénéf. exploit. / Intérêts)",
    valeurs: YEARS.map(y => ratio(computed.vanTirMetrics.icr[y] ?? 0)),
    statuts: YEARS.map(y => {
      const icr = computed.vanTirMetrics.icr[y] ?? 0;
      return icr >= 3 ? "good" : icr >= 1.5 ? "warn" : "bad";
    }),
    norme: "≥ 3×",
  };
  const rowsDettesCaf: AlertRow = {
    indicateur: "Dettes LT / CAF (années)",
    valeurs: YEARS.map(y => ratio(banking[y].dettesCaf)),
    statuts: YEARS.map(y => banking[y].dettesCaf <= 4 ? "good" : banking[y].dettesCaf <= 7 ? "warn" : "bad"),
    norme: "≤ 4 ans",
  };
  const rowsDettesCp: AlertRow = {
    indicateur: "Dettes LT / Capitaux propres",
    valeurs: YEARS.map(y => ratio(banking[y].dettesCp)),
    statuts: YEARS.map(y => banking[y].dettesCp <= 1 ? "good" : banking[y].dettesCp <= 2 ? "warn" : "bad"),
    norme: "≤ 1×",
  };
  const rowsLevier: AlertRow = {
    indicateur: "Levier (Dettes / EBITDA)",
    valeurs: YEARS.map(y => ratio(computed.vanTirMetrics.levier[y])),
    statuts: YEARS.map(y => {
      const l = computed.vanTirMetrics.levier[y];
      return l <= 3 ? "good" : l <= 5 ? "warn" : "bad";
    }),
    norme: "≤ 3×",
  };
  const sectionC = [rowsDSCR, rowsICR, rowsDettesCaf, rowsDettesCp, rowsLevier];

  // ── SECTION D : Conformité OHADA ──────────────────────────────────────────
  const rowsAutonomie: AlertRow = {
    indicateur: "Autonomie financière (CP / Total Actif)",
    valeurs: YEARS.map(y => pct(banking[y].autonomie * 100)),
    statuts: YEARS.map(y => banking[y].autonomie >= 0.25 ? "good" : banking[y].autonomie >= 0.10 ? "warn" : "bad"),
    norme: "≥ 25%",
  };
  const rowsLiquidite: AlertRow = {
    indicateur: "Ratio de liquidité générale",
    valeurs: YEARS.map(y => ratio(computed.vanTirMetrics.liquidite[y])),
    statuts: YEARS.map(y => {
      const liq = computed.vanTirMetrics.liquidite[y];
      return liq >= 1.5 ? "good" : liq >= 1.0 ? "warn" : "bad";
    }),
    norme: "≥ 1,5×",
  };
  const rowsCapPropres: AlertRow = {
    indicateur: "Capitaux propres",
    valeurs: YEARS.map(y => mds(bilan[y].capitauxPropres)),
    statuts: YEARS.map(y => bilan[y].capitauxPropres > 0 ? "good" : "bad"),
    norme: "> 0 (positifs)",
  };
  const rowsCAF: AlertRow = {
    indicateur: "CAF (Capacité d'Autofinancement)",
    valeurs: YEARS.map(y => mds(resultats[y].caf)),
    statuts: YEARS.map(y => resultats[y].caf > 0 ? "good" : "bad"),
    norme: "> 0",
  };
  const rowsBenefice: AlertRow = {
    indicateur: "Bénéfice Net",
    valeurs: YEARS.map(y => mds(resultats[y].beneficeNet)),
    statuts: YEARS.map(y => resultats[y].beneficeNet > 0 ? "good" : "bad"),
    norme: "> 0",
  };
  const sectionD = [rowsAutonomie, rowsLiquidite, rowsCapPropres, rowsCAF, rowsBenefice];

  // ── Global alert count ─────────────────────────────────────────────────────
  const allRows = [...sectionA, ...sectionB, ...sectionC, ...sectionD];
  const nbBad  = allRows.reduce((s, r) => s + r.statuts.filter(x => x === "bad").length,  0);
  const nbWarn = allRows.reduce((s, r) => s + r.statuts.filter(x => x === "warn").length, 0);
  const nbGood = allRows.reduce((s, r) => s + r.statuts.filter(x => x === "good").length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes Bancaires"
        subtitle="Analyse OHADA / SYSCOHADA — Surveillance des indicateurs clés par année"
        badge="4 sections"
      />

      {/* Summary bar */}
      <div className="kpi-primary-depth rounded-xl px-5 py-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-3xl font-bold text-emerald-400">{nbGood}</p>
          <p className="text-white/60 text-xs mt-0.5">Indicateurs satisfaisants</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-3xl font-bold text-amber-300">{nbWarn}</p>
          <p className="text-white/60 text-xs mt-0.5">À surveiller</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-400">{nbBad}</p>
          <p className="text-white/60 text-xs mt-0.5">Alertes critiques</p>
        </div>
      </div>

      <SectionCard
        title="Section A — Équilibre du Bilan"
        subtitle="Structure financière : FRN, trésorerie, immobilisations"
        rows={sectionA}
        years={YEARS}
      />
      <SectionCard
        title="Section B — CEP / Rentabilité"
        subtitle="Compte de résultat : marges, croissance, retour sur actifs"
        rows={sectionB}
        years={YEARS}
      />
      <SectionCard
        title="Section C — DSCR / Solvabilité"
        subtitle="Capacité de remboursement et couverture de la dette"
        rows={sectionC}
        years={YEARS}
      />
      <SectionCard
        title="Section D — Conformité OHADA"
        subtitle="Indicateurs réglementaires SYSCOHADA : autonomie, liquidité, viabilité"
        rows={sectionD}
        years={YEARS}
      />

      {/* Methodology note */}
      <div className="kpi-depth rounded-xl border border-border px-5 py-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-sm mb-2">Note méthodologique</p>
        <p>• DSCR calculé sur base EBE (Excédent Brut d'Exploitation = Bénéfice d'exploitation + Amortissements)</p>
        <p>• Service de la dette = Frais financiers annuels + Remboursement principal emprunt LT</p>
        <p>• Valeur Ajoutée = CA − (Achats MP + Autres achats + Transport + Services ext. + Impôts/Taxes + Autres charges)</p>
        <p>• Normes issues des référentiels SYSCOHADA révisé 2017 et pratiques bancaires CEMAC/UEMOA</p>
      </div>
    </div>
  );
}
