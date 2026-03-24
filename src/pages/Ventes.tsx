import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { ventesNormales, ventesParAnnee, YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(220,60%,22%)", "hsl(186,72%,38%)", "hsl(142,60%,42%)", "hsl(38,85%,50%)"];

const polesParts = [
  { name: "Pôle Infrastructure", value: 2_624_000_000 },
  { name: "Pôle Production", value: 2_985_000_000 },
  { name: "Pôle Services", value: 2_029_000_000 },
  { name: "Pôle Innovation", value: 1_040_000_000 },
];

export default function Ventes() {
  const cols = [
    { key: "label", label: "Produit / Service", align: "left" as const },
    { key: "qte", label: "Qté", align: "right" as const },
    { key: "unite", label: "Unité", align: "center" as const },
    { key: "pu", label: "Prix Unitaire", align: "right" as const },
    { key: "montant", label: "Montant Normal", align: "right" as const },
  ];

  const allRows: any[] = [];
  const poles = [ventesNormales.poleInfrastructure, ventesNormales.poleProduction, ventesNormales.poleServices, ventesNormales.poleInnovation];
  for (const pole of poles) {
    allRows.push({ _section: true, _label: pole.label });
    for (const p of pole.produits) {
      allRows.push({
        label: p.label,
        qte: p.qte.toLocaleString("fr-FR"),
        unite: p.unite,
        pu: formatFcfa(p.pu),
        montant: formatFcfa(p.montant),
        _sub: true,
      });
    }
    allRows.push({ label: `Total ${pole.label}`, qte: "", unite: "", pu: "", montant: formatFcfa(pole.total), _total: true });
  }

  const projCols = [
    { key: "label", label: "Pôle", align: "left" as const },
    ...YEARS.map((y) => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  const projRows = [
    { label: "Pôle Infrastructure", ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(ventesParAnnee[y].infra)])), _sub: true },
    { label: "Pôle Production Énergétiques", ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(ventesParAnnee[y].prod)])), _sub: true },
    { label: "Pôle Services", ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(ventesParAnnee[y].services)])), _sub: true },
    { label: "Pôle Innovation", ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(ventesParAnnee[y].innovation)])), _sub: true },
    { label: "CHIFFRE D'AFFAIRES GLOBAL", ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(ventesParAnnee[y].total)])), _total: true },
    { label: "Taux d'activité", ...Object.fromEntries(YEARS.map((y) => [y.toString(), (ventesParAnnee[y].txActivite * 100).toFixed(0) + "%"])) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau des Ventes" subtitle="Activité normale (100%) et projections par année" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-semibold mb-4">Répartition CA Normal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={polesParts} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {polesParts.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatFcfa(v, true)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {polesParts.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground flex-1 truncate">{p.name}</span>
                <span className="font-mono font-semibold">{formatFcfa(p.value, true)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h3 className="text-primary-foreground font-semibold text-sm">Projections par Année</h3>
            </div>
            <FinTable cols={projCols} rows={projRows} compact />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h3 className="text-primary-foreground font-semibold text-sm">Détail des Produits & Services (Activité Normale 100%)</h3>
        </div>
        <FinTable cols={cols} rows={allRows} />
      </div>
    </div>
  );
}
