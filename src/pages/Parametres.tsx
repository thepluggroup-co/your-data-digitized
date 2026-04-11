import { useParametres } from "@/contexts/ParametresContext";
import PageHeader from "@/components/kenenergie/PageHeader";
import { formatPct, companyInfo } from "@/lib/kenenergie-data";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="bg-primary px-5 py-3">
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

export default function Parametres() {
  const { params, updateParam, resetParams } = useParametres();

  const updateActivity = (idx: number, val: number) => {
    const next = [...params.niveauxActivite] as [number, number, number, number, number];
    next[idx] = val;
    updateParam("niveauxActivite", next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader title="Paramètres du Projet" subtitle="Modifiez les hypothèses — les projections se recalculent automatiquement" badge="⚡ Interactif" />
        <Button variant="outline" size="sm" onClick={resetParams} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Réinitialiser
        </Button>
      </div>

      {/* Identification (read-only) */}
      <Section title="Identification de l'entreprise">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <Row label="Raison Sociale" value={companyInfo.name} />
          <Row label="Promoteur" value={companyInfo.promoteur} />
          <Row label="Forme juridique" value={companyInfo.formeJuridique} />
          <Row label="Ville" value={`${companyInfo.ville}, ${companyInfo.pays}`} />
          <Row label="Téléphone" value={companyInfo.telephone} />
          <Row label="E-mail" value={companyInfo.email} />
          <Row label="Activité principale" value="Infrastructures Électriques BT/HTA/HTB" />
          <Row label="Date du projet" value={companyInfo.dateProjet} />
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
