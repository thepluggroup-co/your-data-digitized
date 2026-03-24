import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import KpiCard from "@/components/kenenergie/KpiCard";
import { resultats, YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { TrendingUp, PiggyBank, Activity, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const chartData = YEARS.map((y) => ({
  annee: y.toString(),
  "Bénéfice net (M)": Math.round(resultats[y].beneficeNet / 1e6),
  "CAF (M)": Math.round(resultats[y].caf / 1e6),
  "Impôts (M)": Math.round(resultats[y].impots / 1e6),
}));

export default function Resultats() {
  const cols = [
    { key: "label", label: "Rubrique", align: "left" as const },
    ...YEARS.map((y) => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  const makeRow = (label: string, keyFn: (y: number) => number, opts?: { total?: boolean; sub?: boolean; pct?: boolean }) => ({
    label,
    ...Object.fromEntries(YEARS.map((y) => [y.toString(), opts?.pct ? keyFn(y).toFixed(2) + "%" : formatFcfa(keyFn(y))])),
    _total: opts?.total,
    _sub: opts?.sub,
  });

  const rows = [
    { _section: true, _label: "COMPTE DE RÉSULTAT" },
    makeRow("Chiffre d'affaires (Ventes)", (y) => resultats[y].ventes, { total: true }),
    makeRow("Coût d'exploitation", (y) => resultats[y].coutExploitation, { sub: true }),
    makeRow("Dotations aux amortissements", (y) => resultats[y].amortissements, { sub: true }),
    makeRow("Bénéfice d'exploitation", (y) => resultats[y].beneficeExploitation, { total: true }),
    makeRow("Intérêts", (y) => resultats[y].interets, { sub: true }),
    makeRow("Bénéfice brut", (y) => resultats[y].beneficeBrut, { total: true }),
    makeRow("Impôts sur le bénéfice (33%)", (y) => resultats[y].impots, { sub: true }),
    makeRow("BÉNÉFICE NET", (y) => resultats[y].beneficeNet, { total: true }),
    { _section: true, _label: "CAPACITÉ D'AUTOFINANCEMENT" },
    makeRow("Capacité d'autofinancement (CAF)", (y) => resultats[y].caf, { total: true }),
    makeRow("Dividendes distribués", (y) => resultats[y].dividendes, { sub: true }),
    makeRow("Réserves cumulées", (y) => resultats[y].reserves, { sub: true }),
    { _section: true, _label: "RATIOS" },
    makeRow("Résultat net / Ventes (%)", (y) => resultats[y].resultatNetVentes, { pct: true }),
    makeRow("Résultat brut / Ventes (%)", (y) => resultats[y].resultatBrutVentes, { pct: true }),
  ];

  const cumul5ans = YEARS.reduce((s, y) => s + resultats[y].beneficeNet, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Comptes de Résultats Prévisionnels" subtitle="Résultats nets et ratios de rentabilité 2027–2031" badge="TIR: 34.87%" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="TIR du projet" value="34.87%" sub="Taux interne de rentabilité" icon={Target} color="accent" />
        <KpiCard label="Bénéfice N" value={formatFcfa(resultats[2027].beneficeNet, true)} sub="Année de démarrage" icon={PiggyBank} color="positive" />
        <KpiCard label="Bénéfice N+4" value={formatFcfa(resultats[2031].beneficeNet, true)} sub="Pleine capacité" icon={TrendingUp} color="primary" />
        <KpiCard label="Bénéfice Cumulé 5 ans" value={formatFcfa(cumul5ans, true)} sub="2027–2031" icon={Activity} color="accent" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Évolution du Bénéfice net et CAF (M FCFA)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => `${v.toLocaleString("fr-FR")} M FCFA`} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Bénéfice net (M)" fill="hsl(220,60%,22%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="CAF (M)" fill="hsl(186,72%,38%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Impôts (M)" fill="hsl(38,85%,55%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Compte de Résultat Détaillé</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact />
      </div>
    </div>
  );
}
