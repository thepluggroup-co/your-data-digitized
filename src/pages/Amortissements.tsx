import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { amortissements, totalAmortissement, YEARS, formatFcfa } from "@/lib/kenenergie-data";

export default function Amortissements() {
  const cols = [
    { key: "intitule", label: "Intitulé", align: "left" as const },
    { key: "valeurTotale", label: "Valeur Totale", align: "right" as const },
    { key: "taux", label: "Taux", align: "right" as const },
    ...YEARS.map((y, i) => ({ key: `a${i}`, label: y.toString(), align: "right" as const })),
    { key: "amt", label: "Amort. Cumulé", align: "right" as const },
    { key: "vnc", label: "VNC", align: "right" as const },
  ];

  const rows: any[] = amortissements.map((a) => ({
    intitule: a.intitule,
    valeurTotale: formatFcfa(a.valeurTotale),
    taux: a.taux > 0 ? (a.taux * 100).toFixed(0) + "%" : "-",
    a0: formatFcfa(a.annees[0]),
    a1: formatFcfa(a.annees[1]),
    a2: formatFcfa(a.annees[2]),
    a3: formatFcfa(a.annees[3]),
    a4: formatFcfa(a.annees[4]),
    amt: formatFcfa(a.amt),
    vnc: formatFcfa(a.vnc),
    _sub: a.intitule.startsWith("  "),
  }));

  rows.push({
    intitule: "TOTAL AMORTISSEMENT",
    valeurTotale: formatFcfa(6_719_350_000),
    taux: "",
    a0: formatFcfa(totalAmortissement.annees[0]),
    a1: formatFcfa(totalAmortissement.annees[1]),
    a2: formatFcfa(totalAmortissement.annees[2]),
    a3: formatFcfa(totalAmortissement.annees[3]),
    a4: formatFcfa(totalAmortissement.annees[4]),
    amt: formatFcfa(totalAmortissement.amt),
    vnc: formatFcfa(totalAmortissement.vnc),
    _total: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau des Amortissements" subtitle="Dotations annuelles par catégorie d'immobilisation (2027–2031)" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {YEARS.map((y, i) => (
          <div key={y} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">Dotation {y}</p>
            <p className="text-base font-bold text-primary font-mono">{formatFcfa(totalAmortissement.annees[i], true)}</p>
          </div>
        ))}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Amort. Cumulé</p>
          <p className="text-base font-bold text-accent font-mono">{formatFcfa(totalAmortissement.amt, true)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Plan d'amortissement détaillé</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact exportName="Amortissements" />
      </div>
    </div>
  );
}
