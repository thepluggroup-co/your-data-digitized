import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { salaires, formatFcfa } from "@/lib/kenenergie-data";

const sousTotal = salaires.reduce((s, r) => s + r.montant, 0);
const commissionsVentes = 4_339_000;
const salaireTotalBrut = sousTotal + commissionsVentes;
const chargesSociales = Math.round(salaireTotalBrut * 0.20);
const chargeSalarialeMensuelle = salaireTotalBrut + chargesSociales;
const masseSalarialeAnnuelle = chargeSalarialeMensuelle * 12;

export default function Salaires() {
  const cols = [
    { key: "poste", label: "Poste", align: "left" as const },
    { key: "qte", label: "Quantité", align: "right" as const },
    { key: "salaire", label: "Salaire Mensuel", align: "right" as const },
    { key: "montant", label: "Montant Mensuel", align: "right" as const },
  ];

  const rows: any[] = salaires.map((s) => ({
    poste: s.poste,
    qte: s.qte,
    salaire: formatFcfa(s.salaire),
    montant: formatFcfa(s.montant),
    _sub: true,
  }));

  rows.push({ poste: "Sous-total salaires", qte: 225, salaire: "", montant: formatFcfa(sousTotal), _total: true });
  rows.push({ poste: "Commissions sur ventes (0.05%)", qte: "", salaire: "", montant: formatFcfa(commissionsVentes) });
  rows.push({ poste: "Salaire total brut", qte: "", salaire: "", montant: formatFcfa(salaireTotalBrut), _total: true });
  rows.push({ poste: "Charges sociales (20%)", qte: "", salaire: "", montant: formatFcfa(chargesSociales) });
  rows.push({ poste: "Charge salariale mensuelle", qte: "", salaire: "", montant: formatFcfa(chargeSalarialeMensuelle), _total: true });
  rows.push({ poste: "Masse salariale annuelle", qte: "", salaire: "", montant: formatFcfa(masseSalarialeAnnuelle), _total: true });

  return (
    <div className="space-y-6">
      <PageHeader title="Objectif des Salaires" subtitle="En activité normale (225 employés)" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Effectif total</p>
          <p className="text-2xl font-bold text-primary font-mono">225</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Charge mensuelle</p>
          <p className="text-lg font-bold text-primary font-mono">{formatFcfa(chargeSalarialeMensuelle, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Masse annuelle</p>
          <p className="text-lg font-bold text-accent font-mono">{formatFcfa(masseSalarialeAnnuelle, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Charges sociales</p>
          <p className="text-lg font-bold text-foreground font-mono">20%</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Détail des Salaires par Poste</h2>
        </div>
        <FinTable cols={cols} rows={rows} exportName="Salaires" />
      </div>
    </div>
  );
}
