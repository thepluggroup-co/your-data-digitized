import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar, Cell } from "recharts";

export default function SeuilRentabilite() {
  const { computed } = useParametres();
  const { seuilRentabilite } = computed;

  const chartData = YEARS.map(y => {
    const s = seuilRentabilite[y];
    return {
      annee: y.toString(),
      ca: Math.round(s.ca / 1e9 * 100) / 100,
      seuil: Math.round(s.seuilCA / 1e9 * 100) / 100,
      chargesFixes: Math.round(s.chargesFixes / 1e9 * 100) / 100,
      chargesVariables: Math.round(s.chargesVariables / 1e9 * 100) / 100,
    };
  });

  const pointMortData = YEARS.map(y => ({
    annee: y.toString(),
    jours: seuilRentabilite[y].pointMortJours,
    mois: seuilRentabilite[y].pointMortMois,
    seuilPct: seuilRentabilite[y].seuilPct,
  }));

  const cols = [
    { key: "label", label: "Indicateur", align: "left" as const },
    ...YEARS.map(y => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  const indicators = [
    { key: "ca", label: "Chiffre d'Affaires", format: (v: number) => formatFcfa(v) },
    { key: "chargesFixes", label: "Charges Fixes", format: (v: number) => formatFcfa(v) },
    { key: "chargesVariables", label: "Charges Variables", format: (v: number) => formatFcfa(v) },
    { key: "tauxMargeCV", label: "Taux Marge sur CV", format: (v: number) => (v * 100).toFixed(2) + "%" },
    { key: "seuilCA", label: "Seuil de Rentabilité (FCFA)", format: (v: number) => formatFcfa(v), total: true },
    { key: "seuilPct", label: "Seuil de Rentabilité (%CA)", format: (v: number) => v.toFixed(2) + "%" },
    { key: "pointMortJours", label: "Point Mort (jours)", format: (v: number) => v + " j" },
    { key: "pointMortMois", label: "Point Mort (mois)", format: (v: number) => v.toFixed(1) + " mois" },
    { key: "margeSecurite", label: "Marge de Sécurité (%)", format: (v: number) => v.toFixed(2) + "%" },
  ];

  const rows = indicators.map(ind => ({
    label: ind.label,
    ...Object.fromEntries(YEARS.map(y => [y.toString(), ind.format((seuilRentabilite[y] as any)[ind.key])])),
    _total: ind.total || false,
    _sub: !ind.total,
  }));

  const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" };

  return (
    <div className="space-y-6">
      <PageHeader title="Seuil de Rentabilité" subtitle="Analyse du point mort et marge de sécurité 2027–2031" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {YEARS.map(y => {
          const s = seuilRentabilite[y];
          return (
            <div key={y} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
              <p className="text-xs text-muted-foreground mb-1">Point mort {y}</p>
              <p className="text-xl font-bold text-primary font-mono">{s.pointMortJours}j</p>
              <p className="text-xs text-muted-foreground">{s.pointMortMois} mois</p>
              <p className={`text-xs font-semibold mt-1 ${s.seuilPct < 70 ? "text-positive" : s.seuilPct < 90 ? "text-warning" : "text-destructive"}`}>
                {s.seuilPct.toFixed(1)}% du CA
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">CA vs Seuil de Rentabilité (Mds FCFA)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" Mds" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Mds FCFA`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="ca" name="Chiffre d'affaires" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Area type="monotone" dataKey="seuil" name="Seuil rentabilité" fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Point Mort (jours) par année</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pointMortData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" j" domain={[0, 360]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === "jours" ? `${v} jours` : `${v}%`} />
              <ReferenceLine y={180} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: "6 mois", fill: "hsl(var(--warning))", fontSize: 10 }} />
              <ReferenceLine y={360} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "12 mois", fill: "hsl(var(--destructive))", fontSize: 10 }} />
              <Bar dataKey="jours" name="Point mort (jours)" radius={[4, 4, 0, 0]}>
                {pointMortData.map((entry, i) => (
                  <Cell key={i} fill={entry.jours < 180 ? "hsl(var(--positive))" : entry.jours < 270 ? "hsl(var(--warning))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marge de sécurité */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {YEARS.map(y => {
          const ms = seuilRentabilite[y].margeSecurite;
          return (
            <div key={y} className="bg-card rounded-xl border border-border p-3 shadow-sm text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Marge sécurité {y}</p>
              <p className={`text-lg font-bold font-mono ${ms > 30 ? "text-positive" : ms > 10 ? "text-warning" : "text-destructive"}`}>
                {ms.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Détail du Seuil de Rentabilité</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact exportName="Seuil_Rentabilite" />
      </div>
    </div>
  );
}
