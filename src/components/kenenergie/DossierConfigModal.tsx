/**
 * DossierConfigModal.tsx
 * Fenêtre de configuration complète du dossier actif.
 * Couvre TOUS les éléments variables et fixes : identification, pôles,
 * financement, activité, charges — édition manuelle + import IA.
 */
import { useState } from "react";
import {
  X, Building2, Target, Landmark, TrendingUp, FileText,
  FileUp, Check, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParametres } from "@/contexts/ParametresContext";
import type { PoleKey } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SmartImportModal from "./SmartImportModal";

interface Props { onClose: () => void; }

type Tab = "entreprise" | "poles" | "financement" | "activite" | "charges";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "entreprise",  label: "Entreprise",  icon: Building2 },
  { key: "poles",       label: "Pôles",        icon: Target },
  { key: "financement", label: "Financement",  icon: Landmark },
  { key: "activite",    label: "Activité",     icon: TrendingUp },
  { key: "charges",     label: "Charges",      icon: FileText },
];

const POLE_KEYS: PoleKey[] = ["poleInfrastructure", "poleProduction", "poleServices", "poleInnovation"];
const POLE_COLORS = [
  "border-l-[hsl(220,60%,40%)] bg-[hsl(220,60%,22%)]/10",
  "border-l-[hsl(186,72%,38%)] bg-[hsl(186,72%,38%)]/10",
  "border-l-[hsl(142,60%,42%)] bg-[hsl(142,60%,42%)]/10",
  "border-l-[hsl(38,85%,50%)]  bg-[hsl(38,85%,50%)]/10",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldText({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <Input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? label} className="h-8 text-sm" />
    </div>
  );
}

function FieldNum({ label, value, onChange, step = 1_000_000, unit = "FCFA" }: {
  label: string; value: number; onChange: (v: number) => void;
  step?: number; unit?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
        <span className="text-[10px] text-muted-foreground/60 font-mono">{value.toLocaleString("fr-FR")} {unit}</span>
      </div>
      <Input type="number" value={value} step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="h-8 text-sm font-mono" />
    </div>
  );
}

function FieldPct({ label, value, onChange, note }: {
  label: string; value: number; onChange: (v: number) => void; note?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
        <span className="text-[10px] text-accent font-mono font-semibold">{(value * 100).toFixed(2)}%</span>
      </div>
      <div className="flex gap-2 items-center">
        <Input type="number" value={(value * 100).toFixed(4)}
          step="0.01" min="0" max="100"
          onChange={e => onChange(Number(e.target.value) / 100)}
          className="h-8 text-sm font-mono flex-1" />
        {note && <span className="text-[9px] text-muted-foreground/50 flex-shrink-0">{note}</span>}
      </div>
    </div>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function TabEntreprise() {
  const { params, updateParam } = useParametres();
  const up = (k: keyof typeof params) => (v: string | number) => updateParam(k, v as never);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FieldText label="Raison sociale"      value={params.companyName}           onChange={up("companyName")} />
      <FieldText label="Promoteur / Gérant"  value={params.companyPromoter}       onChange={up("companyPromoter")} />
      <FieldText label="Forme juridique"     value={params.companyFormeJuridique} onChange={up("companyFormeJuridique")} placeholder="SARL, SA, SUARL…" />
      <FieldText label="Activité principale" value={params.companyActivite}       onChange={up("companyActivite")} />
      <FieldText label="Ville"               value={params.companyVille}          onChange={up("companyVille")} />
      <FieldText label="Pays"                value={params.companyPays}           onChange={up("companyPays")} />
      <FieldText label="Téléphone"           value={params.companyTelephone}      onChange={up("companyTelephone")} />
      <FieldText label="E-mail"              value={params.companyEmail}          onChange={up("companyEmail")} />
      <FieldText label="Date du projet"      value={params.companyDateProjet}     onChange={up("companyDateProjet")} placeholder="JJ/MM/AAAA" />
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Devise</label>
        <div className="flex gap-2">
          {["FCFA", "EUR", "USD", "XOF"].map(d => (
            <button key={d} type="button"
              onClick={() => updateParam("devise", d)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                params.devise === d
                  ? "bg-accent text-white border-accent"
                  : "border-border text-muted-foreground hover:border-accent/40"
              )}>
              {d}
            </button>
          ))}
          <Input value={params.devise} onChange={e => updateParam("devise", e.target.value)}
            className="h-8 text-xs flex-1 min-w-0" placeholder="Autre…" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Année de départ des projections</label>
        <div className="flex gap-2">
          {[2024, 2025, 2026, 2027, 2028].map(y => (
            <button key={y} type="button"
              onClick={() => updateParam("anneeDepart", y)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                params.anneeDepart === y
                  ? "bg-accent text-white border-accent"
                  : "border-border text-muted-foreground hover:border-accent/40"
              )}>
              {y}
            </button>
          ))}
          <Input type="number" value={params.anneeDepart}
            onChange={e => updateParam("anneeDepart", Number(e.target.value))}
            min={2020} max={2040}
            className="h-8 text-xs w-20 font-mono" />
        </div>
        <p className="text-[10px] text-muted-foreground/50">
          Projections : {params.anneeDepart} → {params.anneeDepart + 4}
        </p>
      </div>
    </div>
  );
}

function TabPoles() {
  const { ventesData, updatePoleLabel, addVenteProduit, removeVenteProduit } = useParametres();
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Renommez les 4 pôles d'activité. Les produits sont éditables sur la page <strong>Ventes</strong>.
      </p>
      {POLE_KEYS.map((key, i) => {
        const pole = ventesData[key];
        const total = pole.produits.reduce((s, p) => s + p.qte * p.pu, 0);
        return (
          <div key={key} className={cn("rounded-xl border-l-4 border border-border/40 p-4 space-y-3", POLE_COLORS[i])}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Titre du pôle</label>
                <Input
                  value={pole.label}
                  onChange={e => updatePoleLabel(key, e.target.value)}
                  className="h-8 text-sm font-semibold"
                  placeholder="Nom du pôle…"
                />
              </div>
              <div className="text-right flex-shrink-0 pt-5">
                <p className="text-[10px] text-muted-foreground">{pole.produits.length} produit{pole.produits.length !== 1 ? "s" : ""}</p>
                <p className="text-xs font-mono font-semibold text-foreground">{total.toLocaleString("fr-FR")}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {pole.produits.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px]">
                  <Input
                    value={p.label}
                    onChange={() => {}}
                    readOnly
                    className="h-7 text-[11px] flex-1 bg-muted/30 cursor-default"
                    title="Éditable sur la page Ventes"
                  />
                  <span className="font-mono text-muted-foreground flex-shrink-0 w-24 text-right">{p.pu.toLocaleString("fr-FR")}</span>
                  <button type="button" onClick={() => removeVenteProduit(key, idx)}
                    className="text-destructive/50 hover:text-destructive transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addVenteProduit(key)}
                className="text-[10px] text-accent/70 hover:text-accent flex items-center gap-1 transition-colors pt-1">
                <ChevronRight className="w-3 h-3" /> Ajouter un produit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabFinancement() {
  const { params, updateParam } = useParametres();
  const upN = (k: keyof typeof params) => (v: number) => updateParam(k, v as never);
  const upP = (k: keyof typeof params) => (v: number) => updateParam(k, v as never);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FieldNum label="Capital social"            value={params.capitalSocial}           onChange={upN("capitalSocial")} />
      <FieldNum label="Augmentation de capital"   value={params.augmentationCapital}     onChange={upN("augmentationCapital")} />
      <FieldNum label="Emprunt LT"                value={params.endettementLT}           onChange={upN("endettementLT")} step={10_000_000} />
      <FieldNum label="Comptes courants associés" value={params.comptesCourantsAssocies} onChange={upN("comptesCourantsAssocies")} />
      <div className="sm:col-span-2 border-t border-border/30 pt-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Taux</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldPct label="Taux intérêt LT"      value={params.txInteretEmpruntLT}      onChange={upP("txInteretEmpruntLT")}      note="ex: 8%" />
          <FieldPct label="Taux IS"               value={params.tauxImpotSocietes}       onChange={upP("tauxImpotSocietes")}       note="33% OHADA" />
          <FieldPct label="Taux dividendes"       value={params.txDistributionBenefices} onChange={upP("txDistributionBenefices")} note="0 = réinvesti" />
        </div>
      </div>
    </div>
  );
}

function TabActivite() {
  const { params, updateParam } = useParametres();
  const years = Array.from({ length: 5 }, (_, i) => params.anneeDepart + i);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Niveaux d'activité par année (% de l'activité normale)
        </p>
        <div className="grid grid-cols-5 gap-2">
          {years.map((yr, i) => (
            <div key={i} className="space-y-1">
              <label className="text-[10px] text-muted-foreground text-center block">{yr}</label>
              <Input
                type="number" min="0" max="200" step="1"
                value={Math.round(params.niveauxActivite[i] * 100)}
                onChange={e => {
                  const next = [...params.niveauxActivite] as [number,number,number,number,number];
                  next[i] = Number(e.target.value) / 100;
                  updateParam("niveauxActivite", next);
                }}
                className="h-8 text-sm font-mono text-center"
              />
              <p className="text-[9px] text-accent text-center font-semibold">
                {(params.niveauxActivite[i] * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/30 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldPct label="Augmentation salaires / an" value={params.tauxAugmentationSalaires} onChange={v => updateParam("tauxAugmentationSalaires", v)} note="% annuel" />
        <FieldPct label="Commissions ventes"          value={params.tauxCommissionsVentes}    onChange={v => updateParam("tauxCommissionsVentes", v)} />
        <FieldPct label="Charges sociales (CNPS)"     value={params.tauxChargesSociales}      onChange={v => updateParam("tauxChargesSociales", v)} />
      </div>
    </div>
  );
}

function TabCharges() {
  const { params, updateParam } = useParametres();
  const up = (k: keyof typeof params) => (v: number) => updateParam(k, v as never);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Achats & Approvisionnements</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldPct label="Matières premières"  value={params.tauxMatierePremiere} onChange={up("tauxMatierePremiere")} />
          <FieldPct label="Autres achats"        value={params.tauxAutresAchats}   onChange={up("tauxAutresAchats")} />
          <FieldPct label="Transport / Fret"    value={params.tauxTransport}       onChange={up("tauxTransport")} />
        </div>
      </div>
      <div className="border-t border-border/30 pt-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Services Extérieurs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldPct label="Loyer / Location"    value={params.tauxLoyer}         onChange={up("tauxLoyer")} />
          <FieldPct label="Assurances"           value={params.tauxAssurances}    onChange={up("tauxAssurances")} />
          <FieldPct label="Maintenance"          value={params.tauxMaintenance}   onChange={up("tauxMaintenance")} />
          <FieldPct label="Honoraires"           value={params.tauxHonoraires}    onChange={up("tauxHonoraires")} />
          <FieldPct label="Télécom / Internet"  value={params.tauxTelecom}       onChange={up("tauxTelecom")} />
          <FieldPct label="Publicité / Comm."   value={params.tauxPublicite}     onChange={up("tauxPublicite")} />
          <FieldPct label="Formation"            value={params.tauxFormation}     onChange={up("tauxFormation")} />
          <FieldPct label="Déplacements"         value={params.tauxDeplacements}  onChange={up("tauxDeplacements")} />
          <FieldPct label="Impôts & taxes"      value={params.tauxImpotsTaxes}   onChange={up("tauxImpotsTaxes")} />
          <FieldPct label="Autres charges"       value={params.tauxAutresCharges} onChange={up("tauxAutresCharges")} />
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function DossierConfigModal({ onClose }: Props) {
  const [tab, setTab]         = useState<Tab>("entreprise");
  const [showImport, setImport] = useState(false);
  const { saveCurrentDossier, activeDossier } = useParametres();

  if (showImport) return <SmartImportModal onClose={() => setImport(false)} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-4 px-2">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold">Configuration du dossier</h2>
            <p className="text-[10px] text-muted-foreground truncate">
              {activeDossier?.nom ?? "Aucun dossier actif"} — tous les éléments éditables
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs"
            onClick={() => setImport(true)}>
            <FileUp className="w-3.5 h-3.5" /> Importer via IA
          </Button>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 flex-shrink-0 border-b border-border/30 pb-0 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap",
                tab === key
                  ? "border-accent text-accent bg-accent/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "entreprise"  && <TabEntreprise />}
          {tab === "poles"       && <TabPoles />}
          {tab === "financement" && <TabFinancement />}
          {tab === "activite"    && <TabActivite />}
          {tab === "charges"     && <TabCharges />}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-border/40 flex-shrink-0">
          <p className="text-[10px] text-muted-foreground">Les modifications sont appliquées en temps réel</p>
          <Button type="button" size="sm" className="gap-1.5"
            onClick={() => { saveCurrentDossier(); onClose(); }}>
            <Check className="w-3.5 h-3.5" /> Sauvegarder & Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
