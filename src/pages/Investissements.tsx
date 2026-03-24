import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { investissements, totalInvestissement, YEARS, formatFcfa } from "@/lib/kenenergie-data";

export default function Investissements() {
  const cols = [
    { key: "intitule", label: "Intitulé", align: "left" as const },
    { key: "global", label: "Valeur Globale", align: "right" as const },
    ...YEARS.map((y, i) => ({ key: `a${i}`, label: y.toString(), align: "right" as const })),
  ];

  const rows: any[] = investissements.map((inv) => ({
    intitule: inv.intitule,
    global: formatFcfa(inv.global),
    a0: formatFcfa(inv.an[0]),
    a1: inv.an[1] ? formatFcfa(inv.an[1]) : "-",
    a2: formatFcfa(inv.an[2]),
    a3: inv.an[3] ? formatFcfa(inv.an[3]) : "-",
    a4: formatFcfa(inv.an[4]),
  }));

  rows.push({
    intitule: "TOTAL INVESTISSEMENTS",
    global: formatFcfa(totalInvestissement.global),
    a0: formatFcfa(totalInvestissement.an[0]),
    a1: "-",
    a2: formatFcfa(totalInvestissement.an[2]),
    a3: "-",
    a4: formatFcfa(totalInvestissement.an[4]),
    _total: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Plan des Investissements" subtitle="Répartition des immobilisations sur 5 ans" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-primary-foreground/70 mb-1">Total global</p>
          <p className="text-xl font-bold font-mono">{formatFcfa(totalInvestissement.global, true)}</p>
        </div>
        {YEARS.map((y, i) => (
          <div key={y} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Investissements {y}</p>
            <p className="text-base font-bold font-mono text-foreground">
              {totalInvestissement.an[i] ? formatFcfa(totalInvestissement.an[i], true) : "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Financement initial</p>
          <p className="text-lg font-bold font-mono text-primary">6 010 000 000 FCFA</p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Capital</span><span className="font-mono">10 000 000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">C/C Associé</span><span className="font-mono">1 000 000 000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Emprunt LT (8%)</span><span className="font-mono">5 000 000 000</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Répartition programme de démarrage (40%)</p>
          <div className="space-y-1.5 mt-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Pôle Infrastructure</span><span className="font-mono font-semibold">1 049 600 000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pôle Production</span><span className="font-mono font-semibold">1 194 000 000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pôle Services</span><span className="font-mono font-semibold">811 600 000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pôle Innovation</span><span className="font-mono font-semibold">416 000 000</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Délai de remboursement</p>
          <p className="text-2xl font-bold text-positive font-mono">4 ans</p>
          <p className="text-xs text-muted-foreground mt-1">Investissement initial: 5 289 354 583 FCFA</p>
          <div className="mt-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">VAN (tx 10%)</span><span className="font-mono font-semibold text-positive">2 531 477 610</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">TIR</span><span className="font-mono font-semibold text-accent">34.87%</span></div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Plan d'Investissements Détaillé</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact />
      </div>
    </div>
  );
}
