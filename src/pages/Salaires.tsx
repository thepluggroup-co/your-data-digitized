import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { formatFcfa } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function Salaires() {
  const { salairesData, updateSalaire, addSalaire, removeSalaire, computed, params, updateParam, resetParams } = useParametres();
  const { salairesTotaux } = computed;
  const [editMode, setEditMode] = useState(false);
  const effectifTotal = salairesData.reduce((s, r) => s + r.qte, 0);

  const cols = [
    { key: "poste", label: "Poste", align: "left" as const },
    { key: "qte", label: "Quantité", align: "right" as const },
    { key: "salaire", label: "Salaire Mensuel", align: "right" as const },
    { key: "montant", label: "Montant Mensuel", align: "right" as const },
  ];

  const rows: any[] = salairesData.map((s) => ({
    poste: s.poste,
    qte: s.qte,
    salaire: formatFcfa(s.salaire),
    montant: formatFcfa(s.montant),
    _sub: true,
  }));

  rows.push({ poste: "Sous-total salaires", qte: effectifTotal, salaire: "", montant: formatFcfa(salairesTotaux.sousTotal), _total: true });
  rows.push({ poste: `Commissions sur ventes (${(params.tauxCommissionsVentes * 100).toFixed(1)}%)`, qte: "", salaire: "", montant: formatFcfa(salairesTotaux.commissions) });
  rows.push({ poste: "Salaire total brut", qte: "", salaire: "", montant: formatFcfa(salairesTotaux.brut), _total: true });
  rows.push({ poste: `Charges sociales (${(params.tauxChargesSociales * 100).toFixed(0)}%)`, qte: "", salaire: "", montant: formatFcfa(salairesTotaux.chargesSociales) });
  rows.push({ poste: "Charge salariale mensuelle", qte: "", salaire: "", montant: formatFcfa(salairesTotaux.mensuel), _total: true });
  rows.push({ poste: "Masse salariale annuelle", qte: "", salaire: "", montant: formatFcfa(salairesTotaux.annuel), _total: true });

  return (
    <div className="space-y-6">
      <PageHeader title="Objectif des Salaires" subtitle={`En activité normale (${effectifTotal} employés)`}
        aiPrompt="Analyse la masse salariale : grille cohérente avec le secteur énergétique ? Ratio charges sociales optimal ?" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Effectif total</p>
          <p className="text-2xl font-bold text-primary font-mono">{effectifTotal}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Charge mensuelle</p>
          <p className="text-lg font-bold text-primary font-mono">{formatFcfa(salairesTotaux.mensuel, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Masse annuelle</p>
          <p className="text-lg font-bold text-accent font-mono">{formatFcfa(salairesTotaux.annuel, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Charges sociales</p>
          <p className="text-lg font-bold text-foreground font-mono">{(params.tauxChargesSociales * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Taux éditables */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Paramètres Salariaux</h3>
          <div className="flex gap-2">
            <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? "Terminer" : "Modifier postes"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetParams} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Taux commissions (%)</label>
            <Input type="number" step="0.1" value={(params.tauxCommissionsVentes * 100).toFixed(1)}
              onChange={e => updateParam("tauxCommissionsVentes", parseFloat(e.target.value) / 100 || 0)}
              className="mt-1 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Charges sociales (%)</label>
            <Input type="number" step="1" value={(params.tauxChargesSociales * 100).toFixed(0)}
              onChange={e => updateParam("tauxChargesSociales", parseFloat(e.target.value) / 100 || 0)}
              className="mt-1 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Augmentation annuelle (%)</label>
            <Input type="number" step="0.1" value={(params.tauxAugmentationSalaires * 100).toFixed(1)}
              onChange={e => updateParam("tauxAugmentationSalaires", parseFloat(e.target.value) / 100 || 0)}
              className="mt-1 font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Editable salary table */}
      {editMode ? (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3 flex items-center justify-between">
            <h2 className="text-primary-foreground font-semibold text-sm">Modifier les Salaires</h2>
            <Button size="sm" variant="secondary" onClick={addSalaire} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Ajouter poste
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Poste</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Quantité</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Salaire unitaire</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Montant</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {salairesData.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-1.5">
                      <Input value={s.poste} onChange={e => updateSalaire(i, "poste", e.target.value)}
                        className="h-8 text-sm" />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input type="number" value={s.qte} onChange={e => updateSalaire(i, "qte", parseInt(e.target.value) || 0)}
                        className="h-8 text-sm text-right font-mono w-20 ml-auto" />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input type="number" step="10000" value={s.salaire}
                        onChange={e => updateSalaire(i, "salaire", parseInt(e.target.value) || 0)}
                        className="h-8 text-sm text-right font-mono w-32 ml-auto" />
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-sm font-semibold text-primary">
                      {formatFcfa(s.montant)}
                    </td>
                    <td className="px-2 py-1.5">
                      <Button variant="ghost" size="sm" onClick={() => removeSalaire(i)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3">
            <h2 className="text-primary-foreground font-semibold text-sm">Détail des Salaires par Poste</h2>
          </div>
          <FinTable cols={cols} rows={rows} exportName="Salaires" />
        </div>
      )}
    </div>
  );
}
