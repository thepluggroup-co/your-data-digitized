import { useState } from "react";
import { useParametres } from "@/contexts/ParametresContext";
import PageHeader from "@/components/kenenergie/PageHeader";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, RefreshCw, X, CheckCircle2, TrendingUp, Landmark, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import ExportDossierComplet from "@/components/kenenergie/ExportDossierComplet";
import SmartImportModal from "@/components/kenenergie/SmartImportModal";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="header-gradient px-5 py-3">
        <h2 className="text-primary-foreground font-semibold text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-semibold text-foreground whitespace-nowrap">{value}</span>
    </div>
  );
}

function MoneyInput({ label, value, onChange, step = 1_000_000 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="flex flex-col gap-1.5 py-2 border-b border-border/40 last:border-0">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xs font-mono text-foreground/60">{value.toLocaleString("fr-FR")} FCFA</span>
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        className="h-8 text-sm font-mono"
      />
    </div>
  );
}

function PctSlider({ label, value, onChange, min = 0, max = 1, step = 0.01 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex flex-col gap-2 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-mono font-semibold text-accent">{(value * 100).toFixed(1)}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

const yearLabels = ["N (2027)", "N+1 (2028)", "N+2 (2029)", "N+3 (2030)", "N+4 (2031)"];

// ── Sync Report Modal ─────────────────────────────────────────────────────────
function SyncReportModal({ onClose }: { onClose: () => void }) {
  const { computed, activeDossier } = useParametres();
  const { resultats, bilan, banking, vanTirMetrics, planFinancement } = computed;

  const lastY = YEARS[YEARS.length - 1];
  const firstY = YEARS[0];
  const cafCumul = YEARS.reduce((s, y) => s + resultats[y].caf, 0);
  const avgDSCR = YEARS.reduce((s, y) => s + banking[y].dscrEbe, 0) / YEARS.length;
  const allGreen = YEARS.every(y => banking[y].dscrEbe >= 1.3 && banking[y].autonomie >= 0.2 && resultats[y].beneficeNet > 0);

  const sections = [
    {
      icon: TrendingUp,
      label: "Activité & Résultats",
      items: [
        { k: "CA N (2027)", v: formatFcfa(resultats[firstY].ventes, true) },
        { k: `CA N+4 (${lastY})`, v: formatFcfa(resultats[lastY].ventes, true) },
        { k: "Bénéfice net N+4", v: formatFcfa(resultats[lastY].beneficeNet, true) },
        { k: "CAF cumulée 5 ans", v: formatFcfa(cafCumul, true) },
        { k: "Marge nette N+4", v: resultats[lastY].resultatNetVentes.toFixed(1) + "%" },
        { k: "Marge EBE N+4", v: banking[lastY].margeEbe.toFixed(1) + "%" },
      ],
    },
    {
      icon: Landmark,
      label: "Structure Financière",
      items: [
        { k: "Capitaux propres N+4", v: formatFcfa(bilan[lastY].capitauxPropres, true) },
        { k: "Dettes LT N+4", v: formatFcfa(bilan[lastY].dettesFinancieres, true) },
        { k: "FRN N+4", v: formatFcfa(banking[lastY].frn, true) },
        { k: "Autonomie N+4", v: (banking[lastY].autonomie * 100).toFixed(1) + "%" },
        { k: "Trésorerie nette N+4", v: formatFcfa(banking[lastY].tresoNette, true) },
      ],
    },
    {
      icon: BarChart3,
      label: "Ratios Bancaires",
      items: [
        { k: "DSCR moyen (EBE)", v: avgDSCR.toFixed(2) + "×" },
        { k: "DSCR N (2027)", v: banking[firstY].dscrEbe.toFixed(2) + "×" },
        { k: `DSCR N+4 (${lastY})`, v: banking[lastY].dscrEbe.toFixed(2) + "×" },
        { k: "Levier N+4", v: vanTirMetrics.levier[lastY].toFixed(2) + "×" },
        { k: "Dettes LT / CAF N+4", v: banking[lastY].dettesCaf.toFixed(2) + " ans" },
      ],
    },
    {
      icon: ShieldCheck,
      label: "Indicateurs Projet",
      items: [
        { k: "TIR Projet", v: (vanTirMetrics.irr * 100).toFixed(2) + "%" },
        { k: "VAN (8%)", v: formatFcfa(vanTirMetrics.van8, true) },
        { k: "VAN (10%)", v: formatFcfa(vanTirMetrics.van10, true) },
        { k: "Payback", v: vanTirMetrics.paybackYears.toFixed(1) + " ans" },
        { k: "Investissement total", v: formatFcfa(vanTirMetrics.investissementTotal, true) },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-auto py-6">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6 animate-[slide-up-fade_0.2s_ease]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15">
              <RefreshCw className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Rapport de Synchronisation</h2>
              <p className="text-xs text-muted-foreground">
                {activeDossier ? `Dossier : ${activeDossier.nom}` : "Aucun dossier actif"} • {new Date().toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Fermer" aria-label="Fermer" className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verdict */}
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 mb-5 ${allGreen ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-400/10 border-amber-400/30"}`}>
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${allGreen ? "text-emerald-400" : "text-amber-300"}`} />
          <div>
            <p className={`text-sm font-bold ${allGreen ? "text-emerald-400" : "text-amber-300"}`}>
              {allGreen ? "Synchronisation réussie — Projet conforme" : "Synchronisation réussie — Points d'attention détectés"}
            </p>
            <p className="text-xs text-muted-foreground">Toutes les tables ont été recalculées à partir des paramètres actuels</p>
          </div>
        </div>

        {/* Report grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {sections.map(({ icon: Icon, label, items }) => (
            <div key={label} className="kpi-depth rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-foreground">{label}</span>
              </div>
              <div className="space-y-1">
                {items.map(({ k, v }) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-mono font-semibold text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

export default function Parametres() {
  const { params, updateParam, resetParams } = useParametres();
  const [showSync, setShowSync] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const updateActivity = (idx: number, val: number) => {
    const next = [...params.niveauxActivite] as [number, number, number, number, number];
    next[idx] = val;
    updateParam("niveauxActivite", next);
  };

  return (
    <div className="space-y-6">
      {showSync && <SyncReportModal onClose={() => setShowSync(false)} />}
      {showImport && <SmartImportModal onClose={() => setShowImport(false)} />}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader title="Paramètres du Projet" subtitle="Modifiez les hypothèses — les projections se recalculent automatiquement" badge="⚡ Interactif" />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2 border-accent/40 text-accent hover:bg-accent/10" onClick={() => setShowImport(true)}>
            <Sparkles className="w-4 h-4" /> Importer via IA
          </Button>
          <ExportDossierComplet />
          <Button variant="outline" size="sm" className="gap-2 border-accent/40 text-accent hover:bg-accent/10" onClick={() => setShowSync(true)}>
            <RefreshCw className="w-4 h-4" /> Synchronisation Générale
          </Button>
          <Button variant="outline" size="sm" onClick={resetParams} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Réinitialiser
          </Button>
        </div>
      </div>

      {/* Identification (editable, saved per dossier) */}
      <Section title="Identification de l'entreprise">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <TextInput label="Raison Sociale" value={params.companyName} onChange={v => updateParam("companyName", v)} placeholder="ex: Mon Entreprise SARL" />
          <TextInput label="Promoteur" value={params.companyPromoter} onChange={v => updateParam("companyPromoter", v)} placeholder="Nom du promoteur" />
          <TextInput label="Forme juridique" value={params.companyFormeJuridique} onChange={v => updateParam("companyFormeJuridique", v)} placeholder="SARL, SA, SAS…" />
          <TextInput label="Ville" value={params.companyVille} onChange={v => updateParam("companyVille", v)} placeholder="Douala" />
          <TextInput label="Pays" value={params.companyPays} onChange={v => updateParam("companyPays", v)} placeholder="Cameroun" />
          <TextInput label="Téléphone" value={params.companyTelephone} onChange={v => updateParam("companyTelephone", v)} placeholder="+237 6 00 00 00 00" />
          <TextInput label="E-mail" value={params.companyEmail} onChange={v => updateParam("companyEmail", v)} placeholder="contact@entreprise.com" />
          <TextInput label="Date du projet" value={params.companyDateProjet} onChange={v => updateParam("companyDateProjet", v)} placeholder="JJ/MM/AAAA" />
          <div className="sm:col-span-2">
            <TextInput label="Activité principale" value={params.companyActivite} onChange={v => updateParam("companyActivite", v)} placeholder="Secteur d'activité" />
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finances – EDITABLE */}
        <Section title="💰 Paramètres Financiers (modifiables)">
          <MoneyInput label="Capital social initial" value={params.capitalSocial} onChange={(v) => updateParam("capitalSocial", v)} />
          <MoneyInput label="Augmentation de capital" value={params.augmentationCapital} onChange={(v) => updateParam("augmentationCapital", v)} step={10_000_000} />
          <MoneyInput label="Endettement à long terme" value={params.endettementLT} onChange={(v) => updateParam("endettementLT", v)} step={100_000_000} />
          <MoneyInput label="Comptes courants associés" value={params.comptesCourantsAssocies} onChange={(v) => updateParam("comptesCourantsAssocies", v)} step={50_000_000} />
          <PctSlider label="Taux d'intérêt emprunt LT" value={params.txInteretEmpruntLT} onChange={(v) => updateParam("txInteretEmpruntLT", v)} min={0.01} max={0.20} step={0.005} />
          <PctSlider label="Taux d'impôt sur les sociétés" value={params.tauxImpotSocietes} onChange={(v) => updateParam("tauxImpotSocietes", v)} min={0.10} max={0.50} step={0.01} />
          <PctSlider label="Taux de distribution bénéfices" value={params.txDistributionBenefices} onChange={(v) => updateParam("txDistributionBenefices", v)} min={0} max={0.50} step={0.01} />
        </Section>

        {/* Niveaux activité – EDITABLE */}
        <Section title="📈 Niveaux d'Activité (modifiables)">
          {yearLabels.map((label, i) => (
            <PctSlider
              key={i}
              label={`Année ${label}`}
              value={params.niveauxActivite[i]}
              onChange={(v) => updateActivity(i, v)}
              min={0.10}
              max={1.20}
              step={0.01}
            />
          ))}
          <div className="mt-3 pt-3 border-t border-border/40">
            <PctSlider label="Taux d'augmentation des salaires" value={params.tauxAugmentationSalaires} onChange={(v) => updateParam("tauxAugmentationSalaires", v)} min={0} max={0.10} step={0.005} />
            <PctSlider label="Taux de matière première" value={params.tauxMatierePremiere} onChange={(v) => updateParam("tauxMatierePremiere", v)} min={0.20} max={0.80} step={0.01} />
            <PctSlider label="Taux des autres achats" value={params.tauxAutresAchats} onChange={(v) => updateParam("tauxAutresAchats", v)} min={0.01} max={0.15} step={0.005} />
          </div>
        </Section>
      </div>

      {/* Live preview of key computed metrics */}
      <Section title="🔄 Aperçu des projections recalculées">
        <LivePreview />
      </Section>
    </div>
  );
}

function LivePreview() {
  const { computed } = useParametres();
  const { ventesParAnnee, resultats } = computed;
  const years = [2027, 2028, 2029, 2030, 2031];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-muted-foreground font-medium">Indicateur</th>
            {years.map(y => <th key={y} className="text-right py-2 font-mono text-muted-foreground">{y}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/40">
            <td className="py-2 text-muted-foreground">Chiffre d'Affaires</td>
            {years.map(y => <td key={y} className="text-right py-2 font-mono font-semibold text-foreground">{(ventesParAnnee[y].total / 1e9).toFixed(2)} Mds</td>)}
          </tr>
          <tr className="border-b border-border/40">
            <td className="py-2 text-muted-foreground">Bénéfice Net</td>
            {years.map(y => <td key={y} className="text-right py-2 font-mono font-semibold text-accent">{(resultats[y].beneficeNet / 1e6).toFixed(0)} M</td>)}
          </tr>
          <tr className="border-b border-border/40">
            <td className="py-2 text-muted-foreground">CAF</td>
            {years.map(y => <td key={y} className="text-right py-2 font-mono font-semibold text-primary">{(resultats[y].caf / 1e9).toFixed(2)} Mds</td>)}
          </tr>
          <tr>
            <td className="py-2 text-muted-foreground">Marge nette</td>
            {years.map(y => <td key={y} className="text-right py-2 font-mono font-semibold text-foreground">{resultats[y].resultatNetVentes.toFixed(1)}%</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
