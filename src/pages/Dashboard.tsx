import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, DollarSign, PiggyBank, Target, Zap, Activity } from "lucide-react";
import KpiCard from "@/components/kenenergie/KpiCard";
import PageHeader from "@/components/kenenergie/PageHeader";
import { companyInfo, ventesParAnnee, resultats, formatFcfa, scenarios, YEARS } from "@/lib/kenenergie-data";

const chartData = YEARS.map((y) => ({
  annee: y.toString(),
  ventes: Math.round(ventesParAnnee[y].total / 1e9 * 100) / 100,
  benefice: Math.round(resultats[y].beneficeNet / 1e9 * 100) / 100,
  caf: Math.round(resultats[y].caf / 1e9 * 100) / 100,
}));

const poleData = YEARS.map((y) => ({
  annee: y.toString(),
  Infra: Math.round(ventesParAnnee[y].infra / 1e6),
  Production: Math.round(ventesParAnnee[y].prod / 1e6),
  Services: Math.round(ventesParAnnee[y].services / 1e6),
  Innovation: Math.round(ventesParAnnee[y].innovation / 1e6),
}));

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" };

export default function Dashboard() {
  const lastYear = resultats[2031];
  const firstYear = resultats[2027];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de Bord - KENENERGIE SARL"
        subtitle={`${companyInfo.activite} • ${companyInfo.ville}, ${companyInfo.pays}`}
        badge="Modèle 2027–2031"
      />

      {/* Company info bar */}
      <div className="bg-primary text-primary-foreground rounded-xl px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">Promoteur</p><p className="font-semibold">{companyInfo.promoteur}</p></div>
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">Forme juridique</p><p className="font-semibold">{companyInfo.formeJuridique}</p></div>
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">TIR du projet</p><p className="font-semibold text-accent">34.87%</p></div>
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">Délai de remboursement</p><p className="font-semibold">4 ans</p></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="CA N+4" value={formatFcfa(lastYear.ventes, true)} sub="Pleine capacité" icon={TrendingUp} color="primary" />
        <KpiCard label="Bénéfice N" value={formatFcfa(firstYear.beneficeNet, true)} sub="Année 1" icon={DollarSign} color="positive" />
        <KpiCard label="Bénéfice N+4" value={formatFcfa(lastYear.beneficeNet, true)} sub="Pleine capacité" icon={PiggyBank} color="accent" />
        <KpiCard label="CAF Cumul" value="8.15 Mds" sub="5 ans" icon={Activity} color="accent" />
        <KpiCard label="TIR" value="34.87%" sub="Taux interne" icon={Target} color="warning" />
        <KpiCard label="Seuil rentabilité" value="45.97%" sub="Du CA" icon={Zap} color="primary" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Évolution du CA & Bénéfice net (Mds FCFA)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" Mds" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Mds FCFA`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ventes" name="Chiffre d'affaires" stroke="hsl(220,60%,22%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="benefice" name="Bénéfice net" stroke="hsl(186,72%,38%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="caf" name="CAF" stroke="hsl(142,60%,35%)" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">CA par Pôle (M FCFA)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={poleData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toLocaleString("fr-FR")} M FCFA`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Infra" stackId="a" fill="hsl(220,60%,22%)" />
              <Bar dataKey="Production" stackId="a" fill="hsl(186,72%,38%)" />
              <Bar dataKey="Services" stackId="a" fill="hsl(142,60%,42%)" />
              <Bar dataKey="Innovation" stackId="a" fill="hsl(38,85%,50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scenario Summary */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Synthèse de Scénarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s, i) => (
            <div key={i} className={`rounded-lg p-4 border-2 ${i === 1 ? "border-accent bg-accent/5" : "border-border bg-secondary/30"}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">{s.label}</p>
                {i === 1 && <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-semibold">Référence</span>}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">TIR</span><span className="font-mono font-semibold text-positive">{(s.tir * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CA global</span><span className="font-mono">{formatFcfa(s.ca, true)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bénéfice cumulé</span><span className="font-mono">{formatFcfa(s.beneficeCumul, true)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Effectif</span><span className="font-mono">{s.effectif} pers.</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Niveau opérationnel</span><span className="font-mono">{s.niveauOp} chantiers</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
