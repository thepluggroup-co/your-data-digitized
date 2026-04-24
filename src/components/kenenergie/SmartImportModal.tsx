/**
 * SmartImportModal
 * Upload n'importe quel document → Claude extrait les paramètres → preview → appliquer
 */
import { useState, useRef, useCallback } from "react";
import { useParametres } from "@/contexts/ParametresContext";
import type { EditableParams, SalaryEntry, VentesData, PoleKey, InvEntry, AmortEntry } from "@/contexts/ParametresContext";
import { extractParamsFromDoc } from "@/lib/ai-service";
import type { ExtractedParams, ProjetContexte } from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import {
  X, FileUp, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  Check, ChevronRight, Info, Zap,
} from "lucide-react";

interface Props { onClose: () => void; }

type Section = "identification" | "finances" | "activite" | "servicesExt" | "salaires" | "ventes" | "investissements" | "amortissements";

const SOURCE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  TDR:              { label: "Termes De Référence",    color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  business_plan:    { label: "Business Plan",           color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  rapport_financier:{ label: "Rapport Financier",       color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  devis_bordereau:  { label: "Devis / Bordereau",       color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  planning:         { label: "Planning / Chronogramme", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  autre:            { label: "Document",                color: "bg-muted/30 text-muted-foreground border-border" },
};

const POLE_KEY_LABELS: Record<string, string> = {
  poleInfrastructure: "Pôle Infrastructure",
  poleProduction:     "Pôle Production",
  poleServices:       "Pôle Services",
  poleInnovation:     "Pôle Innovation",
};

const SECTION_LABELS: Record<Section, string> = {
  identification:  "Identification entreprise",
  finances:        "Paramètres financiers",
  activite:        "Niveaux d'activité & charges",
  servicesExt:     "Services extérieurs",
  salaires:        "Masse salariale",
  ventes:          "Ventes & Pôles d'activité",
  investissements: "Investissements",
  amortissements:  "Amortissements",
};

const FIELD_LABELS: Record<string, string> = {
  companyName: "Raison Sociale", companyPromoter: "Promoteur",
  companyFormeJuridique: "Forme juridique", companyVille: "Ville",
  companyPays: "Pays", companyTelephone: "Téléphone",
  companyEmail: "E-mail", companyActivite: "Activité principale",
  companyDateProjet: "Date du projet",
  capitalSocial: "Capital social", augmentationCapital: "Augmentation capital",
  endettementLT: "Endettement LT", comptesCourantsAssocies: "Comptes courants associés",
  txInteretEmpruntLT: "Taux intérêt emprunt LT", tauxImpotSocietes: "Taux IS",
  txDistributionBenefices: "Taux distribution bénéfices",
  niveauxActivite: "Niveaux d'activité (5 ans)",
  tauxAugmentationSalaires: "Taux augmentation salaires",
  tauxMatierePremiere: "Taux matières premières",
  tauxAutresAchats: "Taux autres achats", tauxTransport: "Taux transport",
  tauxCommissionsVentes: "Taux commissions ventes",
  tauxChargesSociales: "Taux charges sociales",
  tauxLoyer: "Loyer", tauxAssurances: "Assurances",
  tauxMaintenance: "Maintenance", tauxHonoraires: "Honoraires",
  tauxTelecom: "Télécom", tauxPublicite: "Publicité",
  tauxFormation: "Formation", tauxDeplacements: "Déplacements",
  tauxImpotsTaxes: "Impôts & taxes", tauxAutresCharges: "Autres charges",
};

function formatValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (Array.isArray(val)) return val.map((v: unknown) => `${((v as number)*100).toFixed(0)}%`).join(" · ");
  if (typeof val === "number") {
    if (key.startsWith("taux") || key.startsWith("tx")) return `${(val * 100).toFixed(2)}%`;
    return val.toLocaleString("fr-FR") + " FCFA";
  }
  return String(val);
}

function countFields(obj: Record<string, unknown>): { total: number; found: number } {
  const entries = Object.entries(obj);
  return { total: entries.length, found: entries.filter(([,v]) => v !== null && v !== undefined).length };
}

export default function SmartImportModal({ onClose }: Props) {
  const { params, setParams, setSalairesData, setVentesData, ventesData, setInvestData, setAmortData, setLastImportedFile, saveCurrentDossier } = useParametres();

  const [step, setStep] = useState<"upload" | "loading" | "preview">("upload");
  const [isDrag, setIsDrag]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<{ fileName: string; extracted: ExtractedParams } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setStep("loading");
    try {
      const contexte: ProjetContexte = {
        nom: params.companyName || "Projet",
        secteur: params.companyActivite || undefined,
        devise: "FCFA",
        exercice: params.companyDateProjet || new Date().getFullYear().toString(),
        libelles_personnalises: {},
        feuilles_connues: [],
      };
      const res = await extractParamsFromDoc(file, contexte);
      setResult({ fileName: res.fileName, extracted: res.extracted });
      // Présélectionner tous les champs non-null
      const auto = new Set<string>();
      const ex = res.extracted;
      const addNonNull = (obj: Record<string, unknown>, prefix: string) => {
        Object.entries(obj ?? {}).forEach(([k, v]) => {
          if (v !== null && v !== undefined) auto.add(`${prefix}.${k}`);
        });
      };
      addNonNull(ex.identification as Record<string, unknown>, "identification");
      addNonNull(ex.finances as Record<string, unknown>, "finances");
      addNonNull(ex.activite as Record<string, unknown>, "activite");
      addNonNull(ex.servicesExt as Record<string, unknown>, "servicesExt");
      if (ex.salaires?.length) auto.add("salaires");
      if (ex.ventes?.poles?.length) auto.add("ventes");
      if (ex.investissements?.length) auto.add("investissements");
      if (ex.amortissements?.length) auto.add("amortissements");
      setSelected(auto);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'extraction");
      setStep("upload");
    }
  }, []);

  const toggleField = (key: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const applySelected = () => {
    if (!result) return;
    const ex = result.extracted;
    const updates: Partial<EditableParams> = {};

    const applySection = (section: Record<string, unknown>, prefix: string) => {
      Object.entries(section ?? {}).forEach(([k, v]) => {
        if (v !== null && v !== undefined && selected.has(`${prefix}.${k}`)) {
          (updates as Record<string, unknown>)[k] = v;
        }
      });
    };
    applySection(ex.identification as Record<string, unknown>, "identification");
    applySection(ex.finances as Record<string, unknown>, "finances");
    applySection(ex.activite as Record<string, unknown>, "activite");
    applySection(ex.servicesExt as Record<string, unknown>, "servicesExt");

    setParams(prev => ({ ...prev, ...updates }));

    if (selected.has("salaires") && ex.salaires?.length) {
      const sal: SalaryEntry[] = ex.salaires.map(s => ({
        poste: s.poste || "Poste",
        qte: s.qte || 1,
        salaire: s.salaire || 0,
        montant: s.montant || (s.qte || 1) * (s.salaire || 0),
      }));
      setSalairesData(sal);
    }

    if (selected.has("ventes") && ex.ventes?.poles?.length) {
      const POLE_KEYS: PoleKey[] = ["poleInfrastructure", "poleProduction", "poleServices", "poleInnovation"];
      setVentesData(prev => {
        const next: VentesData = { ...prev };
        // Réinitialiser les pôles touchés
        const touchedKeys = new Set<PoleKey>();
        ex.ventes!.poles!.forEach(pole => {
          const key = (POLE_KEYS.includes(pole.cle as PoleKey) ? pole.cle : "poleInfrastructure") as PoleKey;
          if (!touchedKeys.has(key)) {
            next[key] = { label: pole.nom || prev[key].label, produits: [] };
            touchedKeys.add(key);
          }
          pole.produits.forEach(p => {
            next[key].produits.push({
              label: p.label || "Produit",
              qte: p.qte || 1,
              pu: p.pu || p.montant || 0,
              montant: p.montant || (p.qte || 1) * (p.pu || 0),
              unite: p.unite || "unité",
            });
          });
        });
        return next;
      });
    }

    if (selected.has("investissements") && ex.investissements?.length) {
      const inv: InvEntry[] = ex.investissements.map(e => ({
        intitule: e.intitule || "Immobilisation",
        global: e.global || 0,
        an: (e.an?.length === 5 ? e.an : [e.global || 0, 0, 0, 0, 0]) as [number,number,number,number,number],
      }));
      setInvestData(inv);
    }

    if (selected.has("amortissements") && ex.amortissements?.length) {
      const amort: AmortEntry[] = ex.amortissements.map(e => ({
        intitule: e.intitule || "Bien",
        valeurTotale: e.valeurTotale || 0,
        taux: e.taux || 0.20,
        annees: (e.annees?.length === 5 ? e.annees : [0, 0, 0, 0, 0]) as [number,number,number,number,number],
        isSubLine: false,
      }));
      setAmortData(amort);
    }

    // Lier le fichier importé au chat IA
    setLastImportedFile({
      fileName: result.fileName,
      fileType: result.extracted.source ?? "document",
      extracted: result.extracted as unknown as Record<string, unknown>,
      importedAt: Date.now(),
    });

    setApplied(true);
    setTimeout(() => { saveCurrentDossier(); }, 200);
  };

  const sections: Section[] = ["identification", "finances", "activite", "servicesExt"];

  const renderSection = (sectionKey: Section) => {
    if (!result) return null;
    const data = result.extracted[sectionKey] as Record<string, unknown>;
    if (!data) return null;
    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
    if (entries.length === 0) return null;
    const { total, found } = countFields(data);

    return (
      <div key={sectionKey} className="space-y-1">
        <div className="flex items-center gap-2 py-1.5">
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">{SECTION_LABELS[sectionKey]}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{found}/{total} champs détectés</span>
          <button type="button" className="text-[10px] text-accent underline"
            onClick={() => {
              const allKeys = entries.map(([k]) => `${sectionKey}.${k}`);
              const allSelected = allKeys.every(k => selected.has(k));
              setSelected(prev => {
                const n = new Set(prev);
                allKeys.forEach(k => allSelected ? n.delete(k) : n.add(k));
                return n;
              });
            }}>
            {entries.every(([k]) => selected.has(`${sectionKey}.${k}`)) ? "Désélectionner" : "Tout sélectionner"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {entries.map(([k, v]) => {
            const fk = `${sectionKey}.${k}`;
            const isChecked = selected.has(fk);
            return (
              <button
                key={k} type="button"
                onClick={() => toggleField(fk)}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${
                  isChecked ? "bg-accent/8 border-accent/40" : "border-border bg-muted/20 opacity-60"
                }`}
              >
                <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
                  isChecked ? "bg-accent border-accent" : "border-border"
                }`}>
                  {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">{FIELD_LABELS[k] ?? k}</p>
                  <p className="text-xs font-semibold font-mono truncate text-foreground">{formatValue(k, v)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-auto py-4">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 flex-shrink-0">
          <div className="p-2 rounded-xl bg-accent/15">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold">Import intelligent par IA</h2>
            <p className="text-xs text-muted-foreground">PDF · Word · Excel · CSV → paramètres auto-remplis par Claude</p>
          </div>
          <button type="button" onClick={onClose} title="Fermer" aria-label="Fermer" className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Upload zone */}
          {step === "upload" && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
                onDragLeave={() => setIsDrag(false)}
                onDrop={e => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                className={`rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 py-12 transition-all ${
                  isDrag ? "border-accent/70 bg-accent/5" : "border-border/50 hover:border-accent/40 hover:bg-muted/20"
                }`}
              >
                <input ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                  aria-label="Sélectionner un document à importer"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
                <div className="p-4 rounded-2xl bg-accent/10">
                  <FileUp className="w-8 h-8 text-accent" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Déposez votre business plan ou dossier financier</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF · Word (.docx) · Excel (.xlsx) · CSV — max 25 Mo</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {["PDF", "Word", "Excel", "CSV"].map(f => (
                    <span key={f} className="text-[10px] bg-muted/50 border border-border px-2.5 py-1 rounded-full font-medium">{f}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 text-xs text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Claude lit le document et extrait : identification de l'entreprise, capital, taux, niveaux d'activité, masse salariale. Vous validez chaque champ avant d'appliquer.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-accent/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-accent animate-pulse" />
                </div>
                <Loader2 className="w-5 h-5 text-accent animate-spin absolute -bottom-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Claude analyse le document…</p>
                <p className="text-xs text-muted-foreground mt-1">Extraction des paramètres en cours</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {step === "preview" && result && !applied && (
            <>
              {/* Source + confidence */}
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground truncate">{result.fileName}</p>
                      {result.extracted.source_type && (() => {
                        const st = SOURCE_TYPE_LABELS[result.extracted.source_type] ?? SOURCE_TYPE_LABELS.autre;
                        return (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{result.extracted.summary}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-accent">{Math.round(result.extracted.confidence * 100)}%</p>
                    <p className="text-[10px] text-muted-foreground">confiance</p>
                  </div>
                </div>
                {(result.extracted.sheetsFound?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground mr-1">Feuilles lues :</span>
                    {result.extracted.sheetsFound!.map((s) => (
                      <span key={s} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">{s}</span>
                    ))}
                  </div>
                )}
                {/* Cartographie des libellés */}
                {(result.extracted.feuilles_detectees?.length ?? 0) > 0 && (
                  <div className="pt-1 border-t border-border/30 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cartographie des feuilles</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="text-muted-foreground/60 border-b border-border/20">
                            <th className="text-left py-0.5 pr-2 font-medium">Source</th>
                            <th className="text-left py-0.5 pr-2 font-medium">Interprétation</th>
                            <th className="text-left py-0.5 font-medium">Module</th>
                            <th className="text-left py-0.5 pl-2 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.extracted.feuilles_detectees!.map((f, i) => (
                            <tr key={i} className="border-b border-border/10">
                              <td className="py-0.5 pr-2 font-mono text-foreground/70 max-w-[100px] truncate">{f.libelle_source}</td>
                              <td className="py-0.5 pr-2 text-foreground/80 max-w-[120px] truncate">{f.interpretation}</td>
                              <td className="py-0.5 text-accent/80">{f.module_cible}</td>
                              <td className="py-0.5 pl-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                  f.statut === "connu" ? "bg-emerald-500/15 text-emerald-400" :
                                  f.statut === "ambigu" ? "bg-amber-500/15 text-amber-400" :
                                  "bg-blue-500/15 text-blue-400"
                                }`}>{f.statut}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Colonnes non standards */}
                {(result.extracted.colonnes_detectees?.filter(c => c.statut !== "connu").length ?? 0) > 0 && (
                  <div className="pt-1 border-t border-border/30 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Libellés non standard détectés</p>
                    <div className="space-y-0.5">
                      {result.extracted.colonnes_detectees!.filter(c => c.statut !== "connu").map((c, i) => (
                        <div key={i} className={`flex items-center gap-2 rounded px-2 py-1 text-[10px] ${
                          c.statut === "ambigu" ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30"
                        }`}>
                          <span className="font-mono text-foreground/60 flex-shrink-0">«{c.libelle_source}»</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-foreground/80 truncate">{c.suggestion_renommage ?? c.intitule_syscohada ?? "?"}</span>
                          {c.compte_ohada && (
                            <span className="ml-auto flex-shrink-0 text-accent/70 font-mono">({c.compte_ohada})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alertes extraction */}
              {result.extracted.alerts?.length > 0 && (
                <div className="space-y-1">
                  {result.extracted.alerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-300">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {a.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Sections */}
              <div className="space-y-4">
                {sections.map(renderSection)}

                {/* Investissements */}
                {(result.extracted.investissements?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide">{SECTION_LABELS.investissements}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{result.extracted.investissements.length} ligne{result.extracted.investissements.length > 1 ? "s" : ""}</span>
                    </div>
                    <button type="button" onClick={() => toggleField("investissements")}
                      className={`w-full flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${selected.has("investissements") ? "bg-accent/8 border-accent/40" : "border-border bg-muted/20 opacity-60"}`}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border mt-0.5 ${selected.has("investissements") ? "bg-accent border-accent" : "border-border"}`}>
                        {selected.has("investissements") && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold">Remplacer le tableau d'investissements</p>
                        {result.extracted.investissements.slice(0, 5).map((e, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground truncate max-w-[180px]">{e.intitule}</span>
                            <span className="font-mono text-foreground/80 ml-2 flex-shrink-0">{(e.global).toLocaleString("fr-FR")} F</span>
                          </div>
                        ))}
                        {result.extracted.investissements.length > 5 && <p className="text-[10px] text-muted-foreground">+{result.extracted.investissements.length - 5} lignes</p>}
                      </div>
                    </button>
                  </div>
                )}

                {/* Amortissements */}
                {(result.extracted.amortissements?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide">{SECTION_LABELS.amortissements}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{result.extracted.amortissements.length} ligne{result.extracted.amortissements.length > 1 ? "s" : ""}</span>
                    </div>
                    <button type="button" onClick={() => toggleField("amortissements")}
                      className={`w-full flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${selected.has("amortissements") ? "bg-accent/8 border-accent/40" : "border-border bg-muted/20 opacity-60"}`}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border mt-0.5 ${selected.has("amortissements") ? "bg-accent border-accent" : "border-border"}`}>
                        {selected.has("amortissements") && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold">Remplacer le tableau d'amortissements</p>
                        {result.extracted.amortissements.slice(0, 5).map((e, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground truncate max-w-[160px]">{e.intitule}</span>
                            <span className="font-mono text-foreground/80 ml-2 flex-shrink-0">{(e.taux * 100).toFixed(0)}% — {(e.valeurTotale).toLocaleString("fr-FR")} F</span>
                          </div>
                        ))}
                        {result.extracted.amortissements.length > 5 && <p className="text-[10px] text-muted-foreground">+{result.extracted.amortissements.length - 5} lignes</p>}
                      </div>
                    </button>
                  </div>
                )}

                {/* Ventes / Pôles */}
                {(result.extracted.ventes?.poles?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide">{SECTION_LABELS.ventes}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{result.extracted.ventes!.poles!.length} pôle{result.extracted.ventes!.poles!.length > 1 ? "s" : ""} détecté{result.extracted.ventes!.poles!.length > 1 ? "s" : ""}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleField("ventes")}
                      className={`w-full flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${
                        selected.has("ventes") ? "bg-accent/8 border-accent/40" : "border-border bg-muted/20 opacity-60"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border mt-0.5 ${
                        selected.has("ventes") ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {selected.has("ventes") && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-semibold">Remplacer les pôles de ventes</p>
                        {result.extracted.ventes!.poles!.map((pole, i) => (
                          <div key={i} className="space-y-0.5">
                            <p className="text-[10px] font-medium text-accent/80">
                              {pole.nom}
                              <span className="text-muted-foreground font-normal ml-1">
                                → {POLE_KEY_LABELS[pole.cle] ?? pole.cle}
                              </span>
                            </p>
                            {pole.produits.slice(0, 3).map((p, j) => (
                              <div key={j} className="flex items-center justify-between text-[10px] pl-2">
                                <span className="text-muted-foreground truncate max-w-[160px]">{p.label}</span>
                                <span className="font-mono text-foreground/80 ml-2 flex-shrink-0">
                                  {p.qte > 1 ? `${p.qte} × ` : ""}{(p.pu).toLocaleString("fr-FR")} F
                                </span>
                              </div>
                            ))}
                            {pole.produits.length > 3 && (
                              <p className="text-[10px] text-muted-foreground pl-2">+{pole.produits.length - 3} produits</p>
                            )}
                          </div>
                        ))}
                        {(result.extracted.ventes!.caTotal?.some(v => v > 0)) && (
                          <p className="text-[10px] text-muted-foreground pt-0.5">
                            CA an 1 : {(result.extracted.ventes!.caTotal![0] ?? 0).toLocaleString("fr-FR")} FCFA
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {/* Salaires */}
                {result.extracted.salaires?.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide">{SECTION_LABELS.salaires}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{result.extracted.salaires.length} postes</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleField("salaires")}
                      className={`w-full flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${
                        selected.has("salaires") ? "bg-accent/8 border-accent/40" : "border-border bg-muted/20 opacity-60"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border mt-0.5 ${
                        selected.has("salaires") ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {selected.has("salaires") && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold mb-1">Remplacer la grille salariale ({result.extracted.salaires.length} postes)</p>
                        <div className="grid grid-cols-1 gap-0.5">
                          {result.extracted.salaires.slice(0, 5).map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground truncate max-w-[160px]">
                                {s.qte > 1 ? `${s.qte}× ` : ""}{s.poste}
                              </span>
                              <span className="font-mono text-foreground/80 ml-2 flex-shrink-0">
                                {(s.salaire ?? 0).toLocaleString("fr-FR")} F/mois
                              </span>
                            </div>
                          ))}
                          {result.extracted.salaires.length > 5 && (
                            <p className="text-[10px] text-muted-foreground">+{result.extracted.salaires.length - 5} autres postes</p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                {selected.size} champ{selected.size !== 1 ? "s" : ""} sélectionné{selected.size !== 1 ? "s" : ""} — les valeurs actuelles seront remplacées
              </p>
            </>
          )}

          {/* Applied */}
          {applied && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Zap className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-400">Paramètres appliqués !</p>
                <p className="text-xs text-muted-foreground mt-1">Les projections ont été recalculées automatiquement</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border/40 flex-shrink-0">
          {step === "preview" && !applied && (
            <>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("upload")}>
                Nouveau fichier
              </Button>
              <Button type="button" className="flex-1 gap-2" disabled={selected.size === 0} onClick={applySelected}>
                <ChevronRight className="w-4 h-4" /> Appliquer {selected.size} champ{selected.size !== 1 ? "s" : ""}
              </Button>
            </>
          )}
          {(step === "upload" || applied) && (
            <Button type="button" className="flex-1" onClick={onClose}>
              {applied ? "Fermer" : "Annuler"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
