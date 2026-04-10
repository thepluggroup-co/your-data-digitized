import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { empruntDetails, formatFcfa } from "@/lib/kenenergie-data";

function groupByYear(versements: typeof empruntDetails.versements) {
  const grouped: Record<number, typeof empruntDetails.versements> = {};
  for (const v of versements) {
    if (!grouped[v.annee]) grouped[v.annee] = [];
    grouped[v.annee].push(v);
  }
  return grouped;
}

export default function Emprunt() {
  const { montant, taux, duree, versementPeriodique, montantInterets, versements } = empruntDetails;
  const grouped = groupByYear(versements);

  const cols = [
    { key: "n", label: "N°", align: "center" as const, className: "w-12" },
    { key: "annee", label: "Année", align: "center" as const },
    { key: "soldeInitial", label: "Solde Initial", align: "right" as const },
    { key: "versement", label: "Versement", align: "right" as const },
    { key: "principal", label: "Principal", align: "right" as const },
    { key: "interets", label: "Intérêts", align: "right" as const },
    { key: "soldeFinal", label: "Solde Final", align: "right" as const },
  ];

  const rows: any[] = [];
  for (const [yr, vrs] of Object.entries(grouped)) {
    for (const v of vrs) {
      rows.push({
        n: v.n,
        annee: v.annee,
        soldeInitial: formatFcfa(v.soldeInitial),
        versement: formatFcfa(v.versement),
        principal: v.principal ? formatFcfa(v.principal) : "-",
        interets: formatFcfa(v.interets),
        soldeFinal: formatFcfa(v.soldeFinal),
      });
    }
    const totalV = vrs.reduce((s, v) => s + v.versement, 0);
    const totalP = vrs.reduce((s, v) => s + v.principal, 0);
    const totalI = vrs.reduce((s, v) => s + v.interets, 0);
    rows.push({
      n: "",
      annee: `Total ${yr}`,
      soldeInitial: "",
      versement: formatFcfa(totalV),
      principal: formatFcfa(totalP),
      interets: formatFcfa(totalI),
      soldeFinal: "",
      _total: true,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de Remboursement des Emprunts" subtitle="Emprunt à long terme – remboursement constant trimestriel" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Montant emprunté</p>
          <p className="text-base font-bold text-primary font-mono">{formatFcfa(montant, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Taux d'intérêt</p>
          <p className="text-base font-bold text-foreground font-mono">{(taux * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Durée</p>
          <p className="text-base font-bold text-foreground font-mono">{duree} ans</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Versement trimestriel</p>
          <p className="text-base font-bold text-accent font-mono">{formatFcfa(versementPeriodique, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Total intérêts</p>
          <p className="text-base font-bold text-negative font-mono">{formatFcfa(montantInterets, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Différé</p>
          <p className="text-base font-bold text-foreground font-mono">12 mois</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Tableau de Remboursement (20 versements trimestriels)</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact exportName="Remboursement_Emprunt" />
      </div>
    </div>
  );
}
