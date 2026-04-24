import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, DollarSign, PiggyBank, Target, Zap, Activity, FolderOpen, FolderPlus, ChevronRight, Save, Sparkles, Loader2, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import KpiCard from "@/components/kenenergie/KpiCard";
import PageHeader from "@/components/kenenergie/PageHeader";
import { formatFcfa, scenarios, YEARS } from "@/lib/kenenergie-data";
import { useParametres } from "@/contexts/ParametresContext";
import ExportPdfButton from "@/components/kenenergie/ExportPdfButton";
import { useNavigate } from "react-router-dom";
import { scoreDossier } from "@/lib/ai-service";
import type { ScoreResult } from "@/lib/ai-service";

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" };

export default function Dashboard() {
  const navigate = useNavigate();
  const { computed, params, activeDossier, allDossiers, isDirty, loadDossier, saveCurrentDossier } = useParametres();
  const { ventesParAnnee, resultats } = computed;

  // ── Score IA ──────────────────────────────────────────────────────────────
  const [aiScore, setAiScore]     = useState<ScoreResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const data = {
        banking: computed.banking,
        resultats: computed.resultats,
        bilan: computed.bilan,
        vanTirMetrics: computed.vanTirMetrics,
        dossier: activeDossier ? { nom: activeDossier.nom, client: activeDossier.client } : null,
        years: YEARS,
      };
      const res = await scoreDossier(data as Record<string, unknown>);
      setAiScore(res);
    } catch {
      setAiError("Serveur IA indisponible");
    } finally {
      setAiLoading(false);
    }
  }, [computed, activeDossier]);

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

  const lastYear = resultats[2031];
  const firstYear = resultats[2027];
  const cafCumul = YEARS.reduce((s, y) => s + resultats[y].caf, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Tableau de Bord — THE PLUG FINANCE CO"
          subtitle={`${params.companyName} • ${params.companyActivite} • ${params.companyVille}, ${params.companyPays}`}
          badge="Modèle 2027–2031"
        />
        <ExportPdfButton />
      </div>

      {/* ── Project selector ── */}
      <div className="kpi-depth rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">Projet actif</span>
            {isDirty && (
              <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full font-semibold">
                Non sauvegardé
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={saveCurrentDossier}
                className="flex items-center gap-1 text-xs text-warning hover:text-warning font-medium px-2.5 py-1 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Sauvegarder
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/dossiers")}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent font-medium px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" /> Gérer les dossiers
            </button>
          </div>
        </div>

        {allDossiers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucun dossier — <button type="button" onClick={() => navigate("/dossiers")} className="text-accent underline">créer le premier</button>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {allDossiers.slice(0, 8).map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => { loadDossier(d.id); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all border ${
                  activeDossier?.id === d.id
                    ? "bg-accent/10 border-accent/40 text-accent"
                    : "bg-muted/30 border-border hover:bg-muted/60 hover:border-border/80 text-foreground"
                }`}
              >
                <FolderOpen className={`w-4 h-4 flex-shrink-0 ${activeDossier?.id === d.id ? "text-accent" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{d.nom}</p>
                  {d.client && <p className="text-[10px] text-muted-foreground truncate">{d.client}</p>}
                </div>
                {activeDossier?.id === d.id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            ))}
            {allDossiers.length > 8 && (
              <button type="button" onClick={() => navigate("/dossiers")} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                +{allDossiers.length - 8} autres
              </button>
            )}
          </div>
        )}
      </div>

      <div className="kpi-primary-depth rounded-xl px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">Promoteur</p><p className="font-semibold">{params.companyPromoter}</p></div>
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">Forme juridique</p><p className="font-semibold">{params.companyFormeJuridique}</p></div>
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">TIR du projet</p><p className="font-semibold text-accent">34.87%</p></div>
        <div><p className="text-primary-foreground/60 text-xs mb-0.5">Délai de remboursement</p><p className="font-semibold">4 ans</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="CA N+4" value={formatFcfa(lastYear.ventes, true)} sub="Pleine capacité" icon={TrendingUp} color="primary"
          aiPrompt="Analyse le CA en pleine capacité et dis-moi s'il est réaliste pour notre secteur." />
        <KpiCard label="Bénéfice N" value={formatFcfa(firstYear.beneficeNet, true)} sub="Année 1" icon={DollarSign} color="positive"
          aiPrompt="Le bénéfice de la première année est-il suffisant ? Quels sont les risques ?" />
        <KpiCard label="Bénéfice N+4" value={formatFcfa(lastYear.beneficeNet, true)} sub="Pleine capacité" icon={PiggyBank} color="accent"
          aiPrompt="Analyse la progression du bénéfice net sur 5 ans et propose des optimisations fiscales." />
        <KpiCard label="CAF Cumul" value={formatFcfa(cafCumul, true)} sub="5 ans" icon={Activity} color="accent"
          aiPrompt="La CAF cumulée sur 5 ans est-elle suffisante pour rembourser les emprunts ?" />
        <KpiCard label="TIR" value="34.87%" sub="Taux interne" icon={Target} color="warning"
          aiPrompt="Le TIR de 34.87% est-il attractif ? Comment l'améliorer ?" />
        <KpiCard label="Seuil rentabilité" value="45.97%" sub="Du CA" icon={Zap} color="primary"
          aiPrompt="Le seuil de rentabilité à 45.97% du CA — est-ce sûr ? Comment le réduire ?" />
      </div>

      {/* ── Widget Score IA ── */}
      <div className="kpi-depth rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Score IA — Bancabilité</h3>
          </div>
          <button
            type="button"
            onClick={fetchScore}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            {aiLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />
            }
            {aiScore ? "Recalculer" : "Analyser le dossier"}
          </button>
        </div>

        {!aiScore && !aiLoading && !aiError && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Cliquez sur "Analyser le dossier" pour obtenir le score de bancabilité IA
          </p>
        )}

        {aiError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {aiError} — vérifiez que le serveur Express (port 3001) est actif.
          </div>
        )}

        {aiLoading && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="w-7 h-7 text-accent animate-spin" />
            <p className="text-xs text-muted-foreground">Analyse IA en cours…</p>
          </div>
        )}

        {aiScore && !aiLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score badge */}
            <div className={`rounded-xl p-4 border-2 flex flex-col items-center justify-center gap-2 ${
              aiScore.niveau === "élevé"  ? "border-emerald-500/40 bg-emerald-500/5" :
              aiScore.niveau === "moyen"  ? "border-amber-400/40 bg-amber-400/5" :
                                            "border-red-500/40 bg-red-500/5"
            }`}>
              {aiScore.niveau === "élevé"
                ? <ShieldCheck className="w-9 h-9 text-emerald-400" />
                : aiScore.niveau === "moyen"
                ? <ShieldAlert className="w-9 h-9 text-amber-300" />
                : <ShieldX className="w-9 h-9 text-red-400" />
              }
              <p className={`text-3xl font-black ${
                aiScore.niveau === "élevé" ? "text-emerald-400" :
                aiScore.niveau === "moyen" ? "text-amber-300" : "text-red-400"
              }`}>{aiScore.score}<span className="text-base font-normal">/100</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{aiScore.niveau}</p>
            </div>

            {/* Points forts */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Points d'analyse</p>
              {aiScore.details.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-foreground">
                  <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-tight">{d}</span>
                </div>
              ))}
            </div>

            {/* Recommandations */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommandations IA</p>
              {aiScore.recommandations.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-foreground">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                  <span className="leading-tight">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-depth rounded-xl border border-border p-5">
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

        <div className="kpi-depth rounded-xl border border-border p-5">
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

      <div className="kpi-depth rounded-xl border border-border p-5">
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
