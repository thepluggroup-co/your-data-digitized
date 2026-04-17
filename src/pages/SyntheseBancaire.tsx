import { useState } from "react";
import PageHeader from "@/components/kenenergie/PageHeader";
import { useParametres } from "@/contexts/ParametresContext";
import { YEARS, formatFcfa, companyInfo } from "@/lib/kenenergie-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, ReferenceLine,
} from "recharts";
import { ShieldCheck, ShieldAlert, ShieldX, TrendingUp, Landmark, BarChart3, CheckCircle2, FileDown, Loader2, Sparkles } from "lucide-react";
import { generateReport } from "@/lib/ai-service";

const tooltipStyle = { fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" };

// ── Traffic light ─────────────────────────────────────────────────────────────
type Status = "good" | "warn" | "bad";
function dot(s: Status) {
  const cls = s === "good" ? "bg-emerald-500" : s === "warn" ? "bg-amber-400" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} flex-shrink-0`} />;
}

function MetricRow({ label, value, status, norme }: { label: string; value: string; status: Status; norme: string }) {
  const txtCls = status === "good" ? "text-emerald-400" : status === "warn" ? "text-amber-300" : "text-red-400";
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 gap-3">
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className={`text-xs font-mono font-bold ${txtCls} flex items-center gap-1.5`}>{dot(status)} {value}</span>
      <span className="text-[10px] text-muted-foreground/60 italic w-16 text-right">{norme}</span>
    </div>
  );
}

// ── Verdict banner ────────────────────────────────────────────────────────────
type Verdict = "BANCABLE" | "A_CONSOLIDER" | "NON_BANCABLE";
function VerdictBanner({ verdict, score }: { verdict: Verdict; score: number }) {
  const config = {
    BANCABLE: {
      icon: ShieldCheck,
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-400",
      label: "DOSSIER BANCABLE",
      sub: "Le projet présente un profil financier favorable à un financement bancaire",
    },
    A_CONSOLIDER: {
      icon: ShieldAlert,
      bg: "bg-amber-400/10 border-amber-400/30",
      text: "text-amber-300",
      label: "À CONSOLIDER",
      sub: "Des points d'amélioration sont nécessaires avant présentation à la banque",
    },
    NON_BANCABLE: {
      icon: ShieldX,
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
      label: "NON BANCABLE",
      sub: "Le projet présente des risques financiers significatifs à corriger",
    },
  }[verdict];
  const Icon = config.icon;
  return (
    <div className={`rounded-xl border px-6 py-5 flex items-center gap-5 ${config.bg}`}>
      <Icon className={`w-12 h-12 flex-shrink-0 ${config.text}`} />
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-2xl font-black tracking-widest ${config.text}`}>{config.label}</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${config.bg} ${config.text}`}>Score {score}/100</span>
        </div>
        <p className="text-sm text-muted-foreground">{config.sub}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SyntheseBancaire() {
  const { computed, activeDossier } = useParametres();
  const { resultats, bilan, chargesExploitation, banking, vanTirMetrics, planFinancement } = computed;

  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setGenLoading(true);
    setGenError(null);
    try {
      const clientName = activeDossier?.client || activeDossier?.nom || "Client";
      const res = await generateReport("synthese-bancaire", {
        banking, resultats, bilan, vanTirMetrics,
        years: YEARS,
        companyInfo,
      }, clientName);
      // Download as .md file
      const blob = new Blob([res.report], { type: "text/markdown;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erreur génération rapport");
    } finally {
      setGenLoading(false);
    }
  };

  const pct  = (v: number) => `${v.toFixed(1)}%`;
  const r2   = (v: number) => v.toFixed(2);
  const mds  = (v: number) => `${(v / 1e9).toFixed(3)} Mds`;

  // ── Section 1: Analyse de l'activité ───────────────────────────────────────
  const chartCA = YEARS.map((y, i) => ({
    annee: y.toString(),
    CA: Math.round(resultats[y].ventes / 1e9 * 100) / 100,
    EBE: Math.round(banking[y].ebe / 1e9 * 100) / 100,
    Croissance: i === 0 ? 0 : Math.round(banking[y].croissanceCA * 10) / 10,
  }));

  // ── Section 2: Structure financière ────────────────────────────────────────
  const chartBilan = YEARS.map(y => ({
    annee: y.toString(),
    "Cap. propres": Math.round(bilan[y].capitauxPropres / 1e9 * 100) / 100,
    "Dettes LT": Math.round(bilan[y].dettesFinancieres / 1e9 * 100) / 100,
    FRN: Math.round(banking[y].frn / 1e9 * 100) / 100,
  }));

  // ── Section 3: Ratios de remboursement ─────────────────────────────────────
  const lastY = YEARS[YEARS.length - 1];
  const firstY = YEARS[0];

  const s3metrics: { label: string; value: string; status: Status; norme: string }[] = YEARS.map(y => ({
    label: `DSCR ${y}`,
    value: r2(banking[y].dscrEbe),
    status: (banking[y].dscrEbe >= 1.3 ? "good" : banking[y].dscrEbe >= 1.0 ? "warn" : "bad") as Status,
    norme: "≥ 1,3×",
  }));

  // ── Section 4: Rentabilité & retour sur investissement ─────────────────────
  const cafCumul = YEARS.reduce((s, y) => s + resultats[y].caf, 0);
  const investTotal = planFinancement[firstY].investissements;

  // ── Score computation (simple weighted) ────────────────────────────────────
  let score = 0;
  const avgDSCR = YEARS.reduce((s, y) => s + banking[y].dscrEbe, 0) / YEARS.length;
  const avgAutonomie = YEARS.reduce((s, y) => s + banking[y].autonomie, 0) / YEARS.length;
  const avgMargeEbe = YEARS.reduce((s, y) => s + banking[y].margeEbe, 0) / YEARS.length;
  const allPosResult = YEARS.every(y => resultats[y].beneficeNet > 0);
  const allPosFRN    = YEARS.every(y => banking[y].frn >= 0);

  if (avgDSCR >= 1.3) score += 25; else if (avgDSCR >= 1.0) score += 15;
  if (avgAutonomie >= 0.25) score += 20; else if (avgAutonomie >= 0.10) score += 10;
  if (avgMargeEbe >= 20) score += 20; else if (avgMargeEbe >= 10) score += 10;
  if (allPosResult) score += 15;
  if (allPosFRN) score += 10;
  if (vanTirMetrics.irr > 0.15) score += 10;

  const verdict: Verdict = score >= 70 ? "BANCABLE" : score >= 45 ? "A_CONSOLIDER" : "NON_BANCABLE";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Synthèse Bancaire"
        subtitle={`${companyInfo.name} • Analyse de bancabilité du projet 2027–2031`}
        badge="4 sections"
      />

      {/* Verdict */}
      <VerdictBanner verdict={verdict} score={score} />

      {/* AI report generation */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={genLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {genLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Sparkles className="w-4 h-4" />
          }
          Générer rapport narratif IA
          {!genLoading && <FileDown className="w-3.5 h-3.5 opacity-60" />}
        </button>
        {genError && (
          <span className="text-xs text-red-400 flex items-center gap-1.5">
            Erreur : {genError}
          </span>
        )}
        {!genError && !genLoading && (
          <span className="text-[10px] text-muted-foreground">
            Analyse IA approfondie · Format Markdown téléchargeable
          </span>
        )}
      </div>

      {/* KPI strip */}
      <div className="kpi-primary-depth rounded-xl px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-white/50 text-xs mb-0.5">TIR Projet</p>
          <p className="font-bold text-accent text-lg">{pct(vanTirMetrics.irr * 100)}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-0.5">VAN (8%)</p>
          <p className="font-bold text-white">{formatFcfa(vanTirMetrics.van8, true)}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-0.5">CAF cumulée 5 ans</p>
          <p className="font-bold text-white">{mds(cafCumul)}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-0.5">Retour invest.</p>
          <p className="font-bold text-white">{vanTirMetrics.paybackYears.toFixed(1)} ans</p>
        </div>
      </div>

      {/* Section 1 — Activité */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">1. Analyse de l'Activité</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-3">Évolution CA & EBE (Mds FCFA)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartCA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" Mds" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Mds FCFA`} />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="CA" name="Chiffre d'affaires" fill="hsl(220,60%,22%)" radius={[3,3,0,0]} />
                <Bar dataKey="EBE" name="EBE" fill="hsl(186,72%,38%)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-0">
            <MetricRow label="Marge EBE N (2027)" value={pct(banking[firstY].margeEbe)} status={banking[firstY].margeEbe >= 20 ? "good" : banking[firstY].margeEbe >= 10 ? "warn" : "bad"} norme="≥ 20%" />
            <MetricRow label={`Marge EBE N+4 (${lastY})`} value={pct(banking[lastY].margeEbe)} status={banking[lastY].margeEbe >= 20 ? "good" : banking[lastY].margeEbe >= 10 ? "warn" : "bad"} norme="≥ 20%" />
            <MetricRow label="Valeur Ajoutée / CA (moy.)" value={pct(banking[lastY].margeVa)} status={banking[lastY].margeVa >= 40 ? "good" : banking[lastY].margeVa >= 25 ? "warn" : "bad"} norme="≥ 40%" />
            <MetricRow label="Résultat Net N+4" value={mds(resultats[lastY].beneficeNet)} status={resultats[lastY].beneficeNet > 0 ? "good" : "bad"} norme="> 0" />
            <MetricRow label="ROA N+4" value={pct(banking[lastY].roa)} status={banking[lastY].roa >= 5 ? "good" : banking[lastY].roa >= 2 ? "warn" : "bad"} norme="≥ 5%" />
          </div>
        </div>
      </div>

      {/* Section 2 — Structure financière */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">2. Structure Financière</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-3">Capitaux propres vs Dettes LT (Mds FCFA)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartBilan} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" Mds" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Mds FCFA`} />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Cap. propres" fill="hsl(142,60%,35%)" radius={[3,3,0,0]} />
                <Bar dataKey="Dettes LT" fill="hsl(220,60%,22%)" radius={[3,3,0,0]} />
                <Bar dataKey="FRN" fill="hsl(186,72%,38%)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-0">
            <MetricRow label="Autonomie financière (N)" value={pct(banking[firstY].autonomie * 100)} status={banking[firstY].autonomie >= 0.25 ? "good" : banking[firstY].autonomie >= 0.10 ? "warn" : "bad"} norme="≥ 25%" />
            <MetricRow label={`Autonomie financière (N+4)`} value={pct(banking[lastY].autonomie * 100)} status={banking[lastY].autonomie >= 0.25 ? "good" : banking[lastY].autonomie >= 0.10 ? "warn" : "bad"} norme="≥ 25%" />
            <MetricRow label="FRN (N)" value={mds(banking[firstY].frn)} status={banking[firstY].frn >= 0 ? "good" : "bad"} norme="≥ 0" />
            <MetricRow label={`FRN (N+4)`} value={mds(banking[lastY].frn)} status={banking[lastY].frn >= 0 ? "good" : "bad"} norme="≥ 0" />
            <MetricRow label="Dettes LT / CP (N+4)" value={r2(banking[lastY].dettesCp)} status={banking[lastY].dettesCp <= 1 ? "good" : banking[lastY].dettesCp <= 2 ? "warn" : "bad"} norme="≤ 1×" />
          </div>
        </div>
      </div>

      {/* Section 3 — Remboursement */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">3. Capacité de Remboursement</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-3">DSCR par année (seuil : 1,3×)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={YEARS.map(y => ({ annee: y.toString(), DSCR: Math.round(banking[y].dscrEbe * 100) / 100 }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, "auto"]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}×`} />
                <ReferenceLine y={1.3} stroke="hsl(38,85%,50%)" strokeDasharray="4 2" label={{ value: "1,3×", position: "right", fontSize: 9 }} />
                <ReferenceLine y={1.0} stroke="hsl(0,85%,55%)" strokeDasharray="4 2" label={{ value: "1,0×", position: "right", fontSize: 9 }} />
                <Bar dataKey="DSCR" name="DSCR EBE" fill="hsl(186,72%,38%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-0">
            {s3metrics.map((m, i) => (
              <MetricRow key={i} label={m.label} value={m.value} status={m.status} norme={m.norme} />
            ))}
          </div>
        </div>
      </div>

      {/* Section 4 — Rentabilité projet */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground">4. Rentabilité & Retour sur Investissement</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: "TIR Projet", value: pct(vanTirMetrics.irr * 100), sub: "Taux interne de rentabilité", ok: vanTirMetrics.irr >= 0.15 },
            { label: "VAN à 8%", value: formatFcfa(vanTirMetrics.van8, true), sub: "Valeur actuelle nette", ok: vanTirMetrics.van8 > 0 },
            { label: "Délai retour", value: `${vanTirMetrics.paybackYears.toFixed(1)} ans`, sub: "Payback sur investissement", ok: vanTirMetrics.paybackYears <= 5 },
            { label: "CAF / Invest.", value: pct((cafCumul / Math.max(1, investTotal)) * 100), sub: "Couverture par autofinancement", ok: cafCumul >= investTotal },
          ].map((k, i) => (
            <div key={i} className={`rounded-xl p-4 border-2 ${k.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-400/30 bg-amber-400/5"}`}>
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.ok ? "text-emerald-400" : "text-amber-300"}`}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{k.sub}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-3">CAF annuelle (Mds FCFA)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={YEARS.map(y => ({ annee: y.toString(), CAF: Math.round(resultats[y].caf / 1e9 * 100) / 100 }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" Mds" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Mds FCFA`} />
              <Line type="monotone" dataKey="CAF" name="CAF" stroke="hsl(142,60%,35%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
