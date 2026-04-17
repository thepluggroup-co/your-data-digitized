import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres, PoleKey } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Plus, Trash2, RotateCcw, Pencil, Eye } from "lucide-react";

const COLORS = ["hsl(220,60%,22%)", "hsl(186,72%,38%)", "hsl(142,60%,42%)", "hsl(38,85%,50%)"];
const POLE_HEADER_CLS = [
  "bg-[hsl(220,60%,22%)]",
  "bg-[hsl(186,72%,38%)]",
  "bg-[hsl(142,60%,42%)]",
  "bg-[hsl(38,85%,50%)]",
];
const LEGEND_DOT_CLS = [
  "bg-[hsl(220,60%,22%)]",
  "bg-[hsl(186,72%,38%)]",
  "bg-[hsl(142,60%,42%)]",
  "bg-[hsl(38,85%,50%)]",
];
const POLE_KEYS: PoleKey[] = ["poleInfrastructure", "poleProduction", "poleServices", "poleInnovation"];

export default function Ventes() {
  const { computed, ventesData, updateVenteProduit, addVenteProduit, removeVenteProduit, resetVentes } = useParametres();
  const ventesParAnnee = computed.ventesParAnnee;
  const [editMode, setEditMode] = useState(false);

  // ── Pie data from live ventesData ──
  const polesParts = POLE_KEYS.map(k => ({
    name: ventesData[k].label,
    value: ventesData[k].produits.reduce((s, p) => s + p.qte * p.pu, 0),
  }));

  // ── Projections table ──
  const projCols = [
    { key: "label", label: "Pôle", align: "left" as const },
    ...YEARS.map(y => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];
  const projRows = [
    { label: "Pôle Infrastructure", ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa(ventesParAnnee[y].infra)])), _sub: true },
    { label: "Pôle Production Énergétiques", ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa(ventesParAnnee[y].prod)])), _sub: true },
    { label: "Pôle Services", ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa(ventesParAnnee[y].services)])), _sub: true },
    { label: "Pôle Innovation", ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa(ventesParAnnee[y].innovation)])), _sub: true },
    { label: "CHIFFRE D'AFFAIRES GLOBAL", ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa(ventesParAnnee[y].total)])), _total: true },
    { label: "Taux d'activité", ...Object.fromEntries(YEARS.map(y => [y.toString(), (ventesParAnnee[y].txActivite * 100).toFixed(0) + "%"])) },
  ];

  // ── Read-only detail table ──
  const detailCols = [
    { key: "label", label: "Produit / Service", align: "left" as const },
    { key: "qte", label: "Qté", align: "right" as const },
    { key: "unite", label: "Unité", align: "center" as const },
    { key: "pu", label: "Prix Unitaire", align: "right" as const },
    { key: "montant", label: "Montant Normal", align: "right" as const },
  ];
  const detailRows: any[] = [];
  POLE_KEYS.forEach(k => {
    const pole = ventesData[k];
    detailRows.push({ _section: true, _label: pole.label });
    pole.produits.forEach(p => {
      detailRows.push({ label: p.label, qte: p.qte.toLocaleString("fr-FR"), unite: p.unite, pu: formatFcfa(p.pu), montant: formatFcfa(p.qte * p.pu), _sub: true });
    });
    const total = pole.produits.reduce((s, p) => s + p.qte * p.pu, 0);
    detailRows.push({ label: `Total ${pole.label}`, qte: "", unite: "", pu: "", montant: formatFcfa(total), _total: true });
  });

  const caTotal = POLE_KEYS.reduce((s, k) => s + ventesData[k].produits.reduce((ss, p) => ss + p.qte * p.pu, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Tableau des Ventes" subtitle="Activité normale (100%) et projections par année" />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={editMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setEditMode(v => !v)}
          >
            {editMode ? <><Eye className="h-3.5 w-3.5" /> Voir tableau</> : <><Pencil className="h-3.5 w-3.5" /> Modifier produits</>}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={resetVentes}>
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
          </Button>
        </div>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="kpi-depth rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-3">Répartition CA Normal</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={polesParts} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {polesParts.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatFcfa(v, true)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {polesParts.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${LEGEND_DOT_CLS[i]}`} />
                <span className="text-muted-foreground flex-1 truncate">{p.name}</span>
                <span className="font-mono font-semibold">{formatFcfa(p.value, true)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs pt-1 border-t border-border/50 font-semibold">
              <span>CA Total normal</span>
              <span className="font-mono text-primary">{formatFcfa(caTotal, true)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="header-gradient px-5 py-3">
              <h3 className="text-primary-foreground font-semibold text-sm">Projections par Année</h3>
            </div>
            <FinTable cols={projCols} rows={projRows} compact exportName="Ventes_Projections" />
          </div>
        </div>
      </div>

      {/* Edit mode: one table per pôle */}
      {editMode ? (
        <div className="space-y-6">
          {POLE_KEYS.map((poleKey, pi) => {
            const pole = ventesData[poleKey];
            const poleTotal = pole.produits.reduce((s, p) => s + p.qte * p.pu, 0);
            return (
              <div key={poleKey} className="bg-card rounded-xl border-2 border-border shadow-sm overflow-hidden">
                <div className={`px-5 py-3 flex items-center justify-between ${POLE_HEADER_CLS[pi]}`}>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{pole.label}</h3>
                    <p className="text-white/70 text-xs mt-0.5">Total : <span className="font-mono font-semibold text-white">{formatFcfa(poleTotal, true)}</span></p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-1 text-xs"
                    onClick={() => addVenteProduit(poleKey)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter ligne
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Produit / Service</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-24">Quantité</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-24">Unité</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-36">Prix Unitaire</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-36">Montant</th>
                        <th className="px-3 py-2 w-10 sr-only">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pole.produits.map((prod, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-3 py-1.5">
                            <Input
                              value={prod.label}
                              onChange={e => updateVenteProduit(poleKey, idx, "label", e.target.value)}
                              className="h-8 text-sm min-w-[180px]"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="number"
                              value={prod.qte}
                              onChange={e => updateVenteProduit(poleKey, idx, "qte", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm text-right font-mono w-24 ml-auto"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              value={prod.unite}
                              onChange={e => updateVenteProduit(poleKey, idx, "unite", e.target.value)}
                              className="h-8 text-sm text-center w-24 mx-auto"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="number"
                              step="100000"
                              value={prod.pu}
                              onChange={e => updateVenteProduit(poleKey, idx, "pu", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm text-right font-mono w-36 ml-auto"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-sm font-semibold text-primary whitespace-nowrap">
                            {formatFcfa(prod.qte * prod.pu)}
                          </td>
                          <td className="px-2 py-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVenteProduit(poleKey, idx)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5 font-semibold border-t-2 border-primary/20">
                        <td className="px-3 py-2 text-xs text-foreground" colSpan={4}>Total {pole.label}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm text-primary">{formatFcfa(poleTotal)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Global total */}
          <div className="bg-primary rounded-xl p-4 text-primary-foreground flex items-center justify-between">
            <span className="font-semibold">CA TOTAL (activité normale 100%)</span>
            <span className="font-mono font-bold text-lg">{formatFcfa(caTotal, true)}</span>
          </div>
        </div>
      ) : (
        /* Read-only detail table */
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="header-gradient px-5 py-3">
            <h3 className="text-primary-foreground font-semibold text-sm">Détail des Produits & Services (Activité Normale 100%)</h3>
          </div>
          <FinTable cols={detailCols} rows={detailRows} exportName="Ventes_Detail" />
        </div>
      )}
    </div>
  );
}
