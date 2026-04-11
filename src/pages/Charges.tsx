import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";

const labels: { key: string; label: string }[] = [
  { key: "achatsMP", label: "Achats Matières Premières" },
  { key: "autresAchats", label: "Autres Achats" },
  { key: "transport", label: "Transport" },
  { key: "servicesExt", label: "Services Extérieurs" },
  { key: "impotsTaxes", label: "Impôts et Taxes" },
  { key: "autresCharges", label: "Autres Charges" },
  { key: "chargesPersonnel", label: "Charges de Personnel" },
  { key: "amortissements", label: "Dotations aux Amortissements" },
  { key: "fraisFinanciers", label: "Frais Financiers" },
  { key: "total", label: "TOTAL DES CHARGES" },
];

export default function Charges() {
  const { computed } = useParametres();
  const { chargesExploitation, ventesParAnnee } = computed;

  const cols = [
    { key: "label", label: "Élément de charge", align: "left" as const },
    ...YEARS.map((y) => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  const rows: any[] = labels.map(({ key, label }) => ({
    label,
    ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa((chargesExploitation[y] as any)[key])])),
    _total: key === "total",
    _sub: key !== "total",
  }));

  rows.push({
    label: "Taux de croissance charges",
    ...Object.fromEntries(YEARS.map((y, i) => {
      if (i === 0) return [y.toString(), "-"];
      const prev = chargesExploitation[YEARS[i - 1]].total;
      const curr = chargesExploitation[y].total;
      return [y.toString(), ((curr - prev) / prev * 100).toFixed(1) + "%"];
    })),
  });

  const margeData = YEARS.map((y) => {
    const marge = ((ventesParAnnee[y].total - chargesExploitation[y].total) / ventesParAnnee[y].total * 100).toFixed(1);
    return { annee: y, marge };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Prévision des Charges d'Exploitation" subtitle="Décomposition annuelle 2027–2031" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {YEARS.map((y) => (
          <div key={y} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">Total {y}</p>
            <p className="text-base font-bold text-primary font-mono">{formatFcfa(chargesExploitation[y].total, true)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {margeData.map(({ annee, marge }) => (
          <div key={annee} className="bg-card rounded-xl border border-border p-3 shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Marge brute {annee}</p>
            <p className="text-base font-bold text-positive font-mono">{marge}%</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Détail des Charges par Année</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact exportName="Charges_Exploitation" />
      </div>
    </div>
  );
}
