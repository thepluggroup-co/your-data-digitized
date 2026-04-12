import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const chargeLabels: { key: string; label: string; paramKey?: string }[] = [
  { key: "achatsMP", label: "Achats Matières Premières", paramKey: "tauxMatierePremiere" },
  { key: "autresAchats", label: "Autres Achats", paramKey: "tauxAutresAchats" },
  { key: "transport", label: "Transport", paramKey: "tauxTransport" },
  { key: "servicesExt", label: "Services Extérieurs (total)" },
  { key: "impotsTaxes", label: "Impôts et Taxes", paramKey: "tauxImpotsTaxes" },
  { key: "autresCharges", label: "Autres Charges", paramKey: "tauxAutresCharges" },
  { key: "chargesPersonnel", label: "Charges de Personnel" },
  { key: "amortissements", label: "Dotations aux Amortissements" },
  { key: "fraisFinanciers", label: "Frais Financiers" },
  { key: "total", label: "TOTAL DES CHARGES" },
];

const servicesExtDetail: { key: string; label: string; paramKey: string }[] = [
  { key: "loyer", label: "Loyer & Charges locatives", paramKey: "tauxLoyer" },
  { key: "assurances", label: "Assurances", paramKey: "tauxAssurances" },
  { key: "maintenance", label: "Maintenance & Entretien", paramKey: "tauxMaintenance" },
  { key: "honoraires", label: "Honoraires & Conseil", paramKey: "tauxHonoraires" },
  { key: "telecom", label: "Télécom & Internet", paramKey: "tauxTelecom" },
  { key: "publicite", label: "Publicité & Communication", paramKey: "tauxPublicite" },
  { key: "formation", label: "Formation", paramKey: "tauxFormation" },
  { key: "deplacements", label: "Déplacements & Missions", paramKey: "tauxDeplacements" },
];

export default function Charges() {
  const { computed, params, updateParam } = useParametres();
  const { chargesExploitation, ventesParAnnee } = computed;
  const [showTaux, setShowTaux] = useState(false);
  const [showServicesDetail, setShowServicesDetail] = useState(false);

  const cols = [
    { key: "label", label: "Élément de charge", align: "left" as const },
    ...YEARS.map((y) => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  // Build rows with services ext detail inserted after the servicesExt line
  const rows: any[] = [];
  chargeLabels.forEach(({ key, label }) => {
    rows.push({
      label,
      ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa((chargesExploitation[y] as any)[key])])),
      _total: key === "total",
      _sub: key !== "total" && key !== "servicesExt",
    });
    // Insert sub-detail after servicesExt
    if (key === "servicesExt") {
      servicesExtDetail.forEach(({ key: sk, label: sl }) => {
        rows.push({
          label: `  ↳ ${sl}`,
          ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa((chargesExploitation[y] as any)[sk])])),
          _sub: true,
        });
      });
    }
  });

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

  const editableTaux = chargeLabels.filter(c => c.paramKey);

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

      {/* Editable rates panel */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTaux(!showTaux)}
          className="w-full flex items-center justify-between px-5 py-3 bg-accent/10 hover:bg-accent/15 transition-colors"
        >
          <h3 className="text-sm font-semibold text-foreground">⚙️ Taux de Charges Modifiables (% du CA)</h3>
          {showTaux ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showTaux && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {editableTaux.map(({ label, paramKey }) => (
                <div key={paramKey}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={((params as any)[paramKey!] * 100).toFixed(2)}
                      onChange={e => updateParam(paramKey as any, parseFloat(e.target.value) / 100 || 0)}
                      className="font-mono text-sm h-8"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services Extérieurs detail panel */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowServicesDetail(!showServicesDetail)}
          className="w-full flex items-center justify-between px-5 py-3 bg-accent/10 hover:bg-accent/15 transition-colors"
        >
          <h3 className="text-sm font-semibold text-foreground">🔧 Détail Services Extérieurs (% du CA)</h3>
          {showServicesDetail ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showServicesDetail && (
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {servicesExtDetail.map(({ label, paramKey }) => (
                <div key={paramKey}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={((params as any)[paramKey] * 100).toFixed(2)}
                      onChange={e => updateParam(paramKey as any, parseFloat(e.target.value) / 100 || 0)}
                      className="font-mono text-sm h-8"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Total Services Ext. = {((params.tauxLoyer + params.tauxAssurances + params.tauxMaintenance + params.tauxHonoraires + params.tauxTelecom + params.tauxPublicite + params.tauxFormation + params.tauxDeplacements) * 100).toFixed(2)}% du CA
            </p>
          </div>
        )}
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
