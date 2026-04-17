import { useState, useMemo } from "react";
import PageHeader from "@/components/kenenergie/PageHeader";
import { useParametres } from "@/contexts/ParametresContext";
import { computeNPV, computeIRR } from "@/contexts/ParametresContext";
import { YEARS, formatFcfa, totalInvestissement } from "@/lib/kenenergie-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Scenario definitions ────────────────────────────────────────────────────
interface ScenarioDef {
  id: string;
  label: string;
  description: string;
  color: string;
  badge: string;
  caMultiplier: number;       // multiplicateur sur le CA
  chargesMultiplier: number;  // multiplicateur sur charges variables opex (hors amort, frais fin)
}

const DEFAULT_SCENARIOS: ScenarioDef[] = [
  {
    id: "stress",
    label: "Stress Test",
    description: "CA −30 % · Charges +15 %",
    color: "#ef4444",
    badge: "Stress",
    caMultiplier: 0.70,
    chargesMultiplier: 1.15,
  },
  {
    id: "pessimiste",
    label: "Pessimiste",
    description: "CA −15 % · Charges +8 %",
    color: "#f97316",
    badge: "Bas",
    caMultiplier: 0.85,
    chargesMultiplier: 1.08,
  },
  {
    id: "base",
    label: "Base",
    description: "Hypothèses de référence",
    color: "#1b2a47",
    badge: "Réf.",
    caMultiplier: 1.00,
    chargesMultiplier: 1.00,
  },
  {
    id: "optimiste",
    label: "Optimiste",
    description: "CA +20 % · Charges −10 %",
    color: "#059669",
    badge: "Haut",
    caMultiplier: 1.20,
    chargesMultiplier: 0.90,
  },
];

const WACC_OPTIONS = [
  { label: "8 %", value: 0.08 },
  { label: "10 %", value: 0.10 },
  { label: "12 %", value: 0.12 },
  { label: "15 %", value: 0.15 },
];

// ─── Scenario computation ────────────────────────────────────────────────────
function computeScenario(
  base: ReturnType<typeof useParametres>["computed"],
  params: ReturnType<typeof useParametres>["params"],
  caM: number,
  chargesM: number
) {
  const IS = params.tauxImpotSocietes;
  const cafByYear: Record<number, number> = {};

  YEARS.forEach(y => {
    const b = base.chargesExploitation[y];
    // Variable charges (scale with CA): matières, autres achats, transport, autres charges
    const varCharges = b.achatsMP + b.autresAchats + b.transport + b.autresCharges;
    // Fixed charges (don't scale): personnel, services ext, impôts/taxes
    const fixCharges = b.chargesPersonnel + b.servicesExt + b.impotsTaxes;
    const amort = b.amortissements;
    const fraisFin = b.fraisFinanciers;

    const newCA = base.ventesParAnnee[y].total * caM;
    const newVar = varCharges * caM * chargesM;
    const newFix = fixCharges * chargesM;
    const newEBITDA = newCA - newVar - newFix;
    const newEBIT = newEBITDA - amort;
    const newEBT = newEBIT - fraisFin;
    const tax = Math.max(0, newEBT) * IS;
    const netIncome = newEBT - tax;
    cafByYear[y] = netIncome + amort;
  });

  const investTotal = totalInvestissement.global;
  const cafSeries = YEARS.map(y => cafByYear[y]);
  const cfs = [-investTotal, ...cafSeries];

  const irr = computeIRR(cfs);
  const van10 = computeNPV(cfs, 0.10);
  const van12 = computeNPV(cfs, 0.12);

  let cum = 0;
  let payback = NaN;
  for (let i = 0; i < cafSeries.length; i++) {
    const prev = cum;
    cum += cafSeries[i];
    if (cum >= investTotal) { payback = i + (investTotal - prev) / cafSeries[i]; break; }
  }

  const beneficeCumul = cafSeries.reduce((s, c) => s + c, 0) - investTotal;
  const ca2031 = base.ventesParAnnee[2031].total * caM;

  return { irr, van10, van12, cafByYear, cafSeries, caf2031: cafByYear[2031], payback, beneficeCumul, ca2031 };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v: number): string {
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + " Mds";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(0) + " M";
  return v.toLocaleString("fr-FR");
}

function pct(v: number): string {
  return (v * 100).toFixed(1) + "%";
}

const tooltipStyle = { fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" };

// ─── Component ───────────────────────────────────────────────────────────────
export default function SensibiliteScenarios() {
  const { computed, params } = useParametres();
  const [waccIdx, setWaccIdx] = useState(1); // default 10%
  const [scenarios, setScenarios] = useState<ScenarioDef[]>(DEFAULT_SCENARIOS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const wacc = WACC_OPTIONS[waccIdx].value;

  const results = useMemo(
    () => scenarios.map(s => ({ ...s, ...computeScenario(computed, params, s.caMultiplier, s.chargesMultiplier) })),
    [scenarios, computed, params]
  );

  // ── CAF par année par scénario (pour ligne chart) ──
  const cafChartData = YEARS.map((y, i) => {
    const row: Record<string, number | string> = { annee: y.toString() };
    results.forEach(r => { row[r.label] = Math.round(r.cafByYear[y] / 1e6); });
    return row;
  });

  // ── Radar: normaliser sur le scénario base ──
  const baseRes = results.find(r => r.id === "base")!;
  const radarData = [
    { metric: "TIR", ...Object.fromEntries(results.map(r => [r.label, r.irr > 0 ? parseFloat((r.irr * 100).toFixed(1)) : 0])) },
    { metric: "VAN/10 (Mds)", ...Object.fromEntries(results.map(r => [r.label, parseFloat((r.van10 / 1e9).toFixed(2))])) },
    { metric: "CAF 2031 (M)", ...Object.fromEntries(results.map(r => [r.label, Math.round(r.caf2031 / 1e6)])) },
    { metric: "CA 2031 (Mds)", ...Object.fromEntries(results.map(r => [r.label, parseFloat((r.ca2031 / 1e9).toFixed(2))])) },
  ];

  // ── Tornado: sensitivity to CA vs Charges ──
  const tornadoBase = results.find(r => r.id === "base")!;
  const tornadoCaUp = computeScenario(computed, params, 1.20, 1.00);
  const tornadoCaDown = computeScenario(computed, params, 0.80, 1.00);
  const tornadoChUp = computeScenario(computed, params, 1.00, 1.15);
  const tornadoChDown = computeScenario(computed, params, 1.00, 0.85);
  const tornadoTauxUp = computeScenario(computed, params, 1.00, 1.00);
  const tornadoData = [
    { param: "CA ±20%", up: parseFloat((tornadoCaUp.van10 / 1e9).toFixed(2)), down: parseFloat((tornadoCaDown.van10 / 1e9).toFixed(2)), base: parseFloat((tornadoBase.van10 / 1e9).toFixed(2)) },
    { param: "Charges ±15%", up: parseFloat((tornadoChDown.van10 / 1e9).toFixed(2)), down: parseFloat((tornadoChUp.van10 / 1e9).toFixed(2)), base: parseFloat((tornadoBase.van10 / 1e9).toFixed(2)) },
  ];

  // ── VAN selon WACC pour chaque scénario ──
  const vanWaccData = WACC_OPTIONS.map(opt => {
    const row: Record<string, number | string> = { wacc: opt.label };
    results.forEach(r => {
      const investTotal = totalInvestissement.global;
      const cfs = [-investTotal, ...YEARS.map(y => r.cafByYear[y])];
      row[r.label] = parseFloat((computeNPV(cfs, opt.value) / 1e9).toFixed(2));
    });
    return row;
  });

  function updateScenario(id: string, field: "caMultiplier" | "chargesMultiplier", raw: string) {
    const val = parseFloat(raw) / 100;
    if (isNaN(val)) return;
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyse de Sensibilité Multi-Scénarios"
        subtitle="Comparaison TIR / VAN — THE PLUG FINANCE CO · KENENERGIE SARL"
        badge="Sensibilité"
      />

      {/* WACC selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Taux d'actualisation (WACC) :</span>
        {WACC_OPTIONS.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setWaccIdx(i)}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              waccIdx === i
                ? "bg-primary text-white"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Scenario cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {results.map(s => {
          const van = computeNPV([-totalInvestissement.global, ...YEARS.map(y => s.cafByYear[y])], wacc);
          const irrPct = s.irr * 100;
          const vsDelta = baseRes && s.id !== "base" ? irrPct - baseRes.irr * 100 : null;
          return (
            <div
              key={s.id}
              className="bg-card rounded-xl border-2 shadow-sm overflow-hidden"
              style={{ borderColor: s.id === "base" ? s.color : "#e2e8f0" }}
            >
              {/* header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: s.color }}>
                <div>
                  <p className="text-white font-bold text-sm">{s.label}</p>
                  <p className="text-white/70 text-[11px]">{s.description}</p>
                </div>
                <span className="text-white/90 text-[10px] font-semibold bg-white/15 px-2 py-0.5 rounded-full">{s.badge}</span>
              </div>

              {/* KPI grid */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">TIR projet</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-sm" style={{ color: irrPct > 20 ? "#059669" : irrPct > 10 ? "#f59e0b" : "#ef4444" }}>
                      {irrPct > 0 ? pct(s.irr) : "n/a"}
                    </span>
                    {vsDelta !== null && (
                      <span className={`text-[10px] font-semibold ${vsDelta >= 0 ? "text-positive" : "text-destructive"}`}>
                        {vsDelta >= 0 ? "+" : ""}{vsDelta.toFixed(1)}pp
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">VAN ({WACC_OPTIONS[waccIdx].label})</span>
                  <span className={`font-mono font-semibold text-xs ${van >= 0 ? "text-positive" : "text-destructive"}`}>
                    {fmt(van)} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">CAF 2031</span>
                  <span className="font-mono text-xs font-semibold">{fmt(s.caf2031)} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Retour invest.</span>
                  <span className="font-mono text-xs font-semibold">
                    {isNaN(s.payback) ? "> 5 ans" : `${s.payback.toFixed(1)} ans`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">CA 2031</span>
                  <span className="font-mono text-xs">{fmt(s.ca2031)} FCFA</span>
                </div>

                {/* editable multipliers */}
                <div
                  className="mt-3 pt-3 border-t border-border/50 cursor-pointer"
                  onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                >
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                    <Sliders className="w-3 h-3" />
                    <span>Ajuster les hypothèses</span>
                  </div>
                </div>
                {editingId === s.id && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">CA × (% base)</label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="1"
                          value={(s.caMultiplier * 100).toFixed(0)}
                          onChange={e => updateScenario(s.id, "caMultiplier", e.target.value)}
                          className="h-7 text-xs font-mono"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Charges × (% base)</label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="1"
                          value={(s.chargesMultiplier * 100).toFixed(0)}
                          onChange={e => updateScenario(s.id, "chargesMultiplier", e.target.value)}
                          className="h-7 text-xs font-mono"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts row 1: TIR comparaison + VAN par WACC ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TIR comparaison */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">TIR par scénario (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{ name: "TIR", ...Object.fromEntries(results.map(r => [r.label, parseFloat((r.irr * 100).toFixed(2))])) }]}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, "auto"]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, ""]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {results.map(r => (
                <Bar key={r.id} dataKey={r.label} fill={r.color} radius={[4, 4, 0, 0]} />
              ))}
              <ReferenceLine y={15} stroke="#94a3b8" strokeDasharray="4 3" label={{ value: "15% (min)", fill: "#94a3b8", fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* VAN selon WACC */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">VAN selon le taux d'actualisation (Mds FCFA)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={vanWaccData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="wacc" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" Mds" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} Mds FCFA`, ""]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 3" />
              {results.map(r => (
                <Line key={r.id} type="monotone" dataKey={r.label} stroke={r.color} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2: CAF évolution + Tornado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CAF évolution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Évolution de la CAF par scénario (M FCFA)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={cafChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" M" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString("fr-FR")} M FCFA`, ""]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {results.map(r => (
                <Line
                  key={r.id}
                  type="monotone"
                  dataKey={r.label}
                  stroke={r.color}
                  strokeWidth={r.id === "base" ? 3 : 1.5}
                  strokeDasharray={r.id === "base" ? undefined : r.id === "stress" ? "5 3" : undefined}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tornado VAN */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Analyse Tornado — Impact sur la VAN à 10% (Mds FCFA)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tornadoData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit=" Mds" />
              <YAxis type="category" dataKey="param" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} Mds FCFA`, ""]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine x={tornadoBase.van10 / 1e9} stroke="#1b2a47" strokeDasharray="4 3" label={{ value: "Base", fill: "#1b2a47", fontSize: 10 }} />
              <Bar dataKey="up" name="Hausse" fill="#059669" radius={[0, 4, 4, 0]} />
              <Bar dataKey="down" name="Baisse" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">CA ±20% | Charges ±15% — toutes choses égales par ailleurs</p>
        </div>
      </div>

      {/* ── Tableau de synthèse comparatif ── */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="header-gradient px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Tableau de Synthèse — Comparaison des Scénarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="table-header-cell text-left">Indicateur</th>
                {results.map(r => (
                  <th key={r.id} className="table-header-cell text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-white text-[11px] font-semibold" style={{ background: r.color }}>
                      {r.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "CA × base", render: (r: typeof results[0]) => pct(r.caMultiplier - 0) },
                { label: "Charges × base", render: (r: typeof results[0]) => pct(r.chargesMultiplier - 0) },
                { label: "TIR projet", render: (r: typeof results[0]) => r.irr > 0 ? pct(r.irr) : "n/a", bold: true },
                { label: `VAN (${WACC_OPTIONS[waccIdx].label})`, render: (r: typeof results[0]) => {
                  const v = computeNPV([-totalInvestissement.global, ...YEARS.map(y => r.cafByYear[y])], wacc);
                  return fmt(v) + " FCFA";
                }, bold: true },
                { label: "VAN (10%)", render: (r: typeof results[0]) => fmt(r.van10) + " FCFA" },
                { label: "VAN (12%)", render: (r: typeof results[0]) => fmt(r.van12) + " FCFA" },
                { label: "CAF 2027", render: (r: typeof results[0]) => fmt(r.cafByYear[2027]) + " FCFA" },
                { label: "CAF 2031", render: (r: typeof results[0]) => fmt(r.caf2031) + " FCFA" },
                { label: "CA 2031", render: (r: typeof results[0]) => fmt(r.ca2031) + " FCFA" },
                { label: "Délai remboursement", render: (r: typeof results[0]) => isNaN(r.payback) ? "> 5 ans" : `${r.payback.toFixed(1)} ans` },
              ].map((row, i) => (
                <tr key={i} className={`border-t border-border/50 ${i % 2 === 0 ? "bg-white" : "bg-muted/20"} ${row.bold ? "font-semibold" : ""}`}>
                  <td className="px-4 py-2 text-foreground text-xs">{row.label}</td>
                  {results.map(r => {
                    const val = row.render(r);
                    return (
                      <td key={r.id} className="px-4 py-2 text-center font-mono text-xs">{val}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Conclusion / recommandation ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map(r => {
          const van = computeNPV([-totalInvestissement.global, ...YEARS.map(y => r.cafByYear[y])], wacc);
          const viable = r.irr > wacc && van > 0;
          const Icon = viable ? TrendingUp : r.irr > 0 ? Minus : TrendingDown;
          return (
            <div
              key={r.id}
              className={`rounded-xl border-2 p-4 flex items-start gap-3 ${
                viable ? "border-positive/40 bg-positive/5" : r.irr > 0 ? "border-warning/40 bg-warning/5" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${viable ? "bg-positive text-white" : r.irr > 0 ? "bg-warning text-white" : "bg-destructive text-white"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                <p className={`text-xs font-semibold mt-1.5 ${viable ? "text-positive" : r.irr > 0 ? "text-warning" : "text-destructive"}`}>
                  {viable
                    ? `Projet viable — TIR ${pct(r.irr)} > WACC ${pct(wacc)} · VAN positive`
                    : r.irr > wacc
                    ? `VAN négative au WACC ${pct(wacc)} — risque élevé`
                    : `Scénario critique — TIR insuffisant ou VAN négative`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
