import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";
import { useParametres, EditableParams } from "@/contexts/ParametresContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";

// ─── Charge line config ───────────────────────────────────────────────────
interface ChargeLineDef {
  key: string;
  label: string;
  tauxKey?: keyof EditableParams;
  fixedKey?: keyof EditableParams;
  isTotal?: boolean;
  isHeader?: boolean; // for servicesExt aggregate line
}

const MAIN_LINES: ChargeLineDef[] = [
  { key: "achatsMP",        label: "Achats Matières Premières",     tauxKey: "tauxMatierePremiere", fixedKey: "fixedAchatsMP" },
  { key: "autresAchats",    label: "Autres Achats",                  tauxKey: "tauxAutresAchats",    fixedKey: "fixedAutresAchats" },
  { key: "transport",       label: "Transport",                      tauxKey: "tauxTransport",       fixedKey: "fixedTransport" },
  { key: "servicesExt",     label: "Services Extérieurs (total)",                                                                    isHeader: true },
  { key: "impotsTaxes",     label: "Impôts et Taxes",               tauxKey: "tauxImpotsTaxes",     fixedKey: "fixedImpotsTaxes" },
  { key: "autresCharges",   label: "Autres Charges",                 tauxKey: "tauxAutresCharges",   fixedKey: "fixedAutresCharges" },
  { key: "chargesPersonnel",label: "Charges de Personnel" },
  { key: "amortissements",  label: "Dotations aux Amortissements" },
  { key: "fraisFinanciers", label: "Frais Financiers" },
  { key: "total",           label: "TOTAL DES CHARGES",                                                                              isTotal: true },
];

const SERVICES_EXT_LINES: ChargeLineDef[] = [
  { key: "loyer",        label: "Loyer & Charges locatives",   tauxKey: "tauxLoyer",        fixedKey: "fixedLoyer" },
  { key: "assurances",   label: "Assurances",                  tauxKey: "tauxAssurances",   fixedKey: "fixedAssurances" },
  { key: "maintenance",  label: "Maintenance & Entretien",     tauxKey: "tauxMaintenance",  fixedKey: "fixedMaintenance" },
  { key: "honoraires",   label: "Honoraires & Conseil",        tauxKey: "tauxHonoraires",   fixedKey: "fixedHonoraires" },
  { key: "telecom",      label: "Télécom & Internet",          tauxKey: "tauxTelecom",      fixedKey: "fixedTelecom" },
  { key: "publicite",    label: "Publicité & Communication",   tauxKey: "tauxPublicite",    fixedKey: "fixedPublicite" },
  { key: "formation",    label: "Formation",                   tauxKey: "tauxFormation",    fixedKey: "fixedFormation" },
  { key: "deplacements", label: "Déplacements & Missions",     tauxKey: "tauxDeplacements", fixedKey: "fixedDeplacements" },
];

const ICONS: Record<string, string> = {
  loyer: "🏢", assurances: "🛡️", maintenance: "🔧", honoraires: "⚖️",
  telecom: "📡", publicite: "📢", formation: "🎓", deplacements: "✈️",
};

// ─── Editable charge row component ───────────────────────────────────────
function EditableChargeRow({
  def, params, ca2027, updateParam,
}: {
  def: ChargeLineDef;
  params: ReturnType<typeof useParametres>["params"];
  ca2027: number;
  updateParam: ReturnType<typeof useParametres>["updateParam"];
}) {
  const isFixed = def.fixedKey ? (params[def.fixedKey] as number) > 0 : false;

  const toggleMode = () => {
    if (!def.fixedKey || !def.tauxKey) return;
    if (isFixed) {
      updateParam(def.fixedKey, 0 as any);
    } else {
      // Pre-fill with current computed amount at 100% activity
      const computed = Math.round(ca2027 * (params[def.tauxKey] as number));
      updateParam(def.fixedKey, computed as any);
    }
  };

  if (!def.tauxKey) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Mode toggle */}
      <button
        type="button"
        onClick={toggleMode}
        title={isFixed ? "Passer en % CA" : "Passer en montant fixe"}
        className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${isFixed ? "bg-warning/15 text-warning hover:bg-warning/25" : "bg-muted/40 text-muted-foreground hover:bg-muted/70"}`}
      >
        {isFixed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
      </button>

      {isFixed ? (
        /* Montant fixe annuel */
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Input
            type="number"
            step="100000"
            value={params[def.fixedKey!] as number}
            onChange={e => updateParam(def.fixedKey!, parseFloat(e.target.value) || 0 as any)}
            className="font-mono text-xs h-7 flex-1"
          />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">FCFA/an</span>
        </div>
      ) : (
        /* Taux % CA */
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Input
            type="number"
            step="0.01"
            value={((params[def.tauxKey!] as number) * 100).toFixed(2)}
            onChange={e => updateParam(def.tauxKey!, parseFloat(e.target.value) / 100 || 0 as any)}
            className="font-mono text-xs h-7 flex-1"
          />
          <span className="text-[10px] text-muted-foreground">% CA</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function Charges() {
  const { computed, params, updateParam } = useParametres();
  const { chargesExploitation, ventesParAnnee } = computed;
  const [showTaux, setShowTaux] = useState(false);

  const ca2027 = ventesParAnnee[2027].total;

  const cols = [
    { key: "label", label: "Élément de charge", align: "left" as const },
    ...YEARS.map(y => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  // Build table rows (main lines + servicesExt sub-detail)
  const rows: any[] = [];
  MAIN_LINES.forEach(({ key, label, isTotal, isHeader }) => {
    rows.push({
      label,
      ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa((chargesExploitation[y] as any)[key])])),
      _total: isTotal,
      _sub: !isTotal && !isHeader,
    });
    if (key === "servicesExt") {
      SERVICES_EXT_LINES.forEach(({ key: sk, label: sl }) => {
        rows.push({
          label: `  ↳ ${ICONS[sk] ?? ""} ${sl}`,
          ...Object.fromEntries(YEARS.map(y => [y.toString(), formatFcfa((chargesExploitation[y] as any)[sk])])),
          _sub: true,
        });
      });
    }
  });

  rows.push({
    label: "Taux de croissance charges",
    ...Object.fromEntries(YEARS.map((y, i) => {
      if (i === 0) return [y.toString(), "—"];
      const prev = chargesExploitation[YEARS[i - 1]].total;
      const curr = chargesExploitation[y].total;
      return [y.toString(), ((curr - prev) / prev * 100).toFixed(1) + "%"];
    })),
  });

  const margeData = YEARS.map(y => ({
    annee: y,
    marge: ((ventesParAnnee[y].total - chargesExploitation[y].total) / ventesParAnnee[y].total * 100).toFixed(1),
  }));

  const totalServExt = params.tauxLoyer + params.tauxAssurances + params.tauxMaintenance +
    params.tauxHonoraires + params.tauxTelecom + params.tauxPublicite +
    params.tauxFormation + params.tauxDeplacements;

  const fixedCount = SERVICES_EXT_LINES.filter(l => l.fixedKey && (params[l.fixedKey] as number) > 0).length
    + MAIN_LINES.filter(l => l.fixedKey && (params[l.fixedKey] as number) > 0 && l.key !== "servicesExt").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prévision des Charges d'Exploitation"
        subtitle="Décomposition annuelle 2027–2031"
        badge={fixedCount > 0 ? `${fixedCount} montant(s) fixe(s)` : undefined}
      />

      {/* Total KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {YEARS.map(y => (
          <div key={y} className="kpi-depth rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total {y}</p>
            <p className="text-base font-bold text-primary font-mono">{formatFcfa(chargesExploitation[y].total, true)}</p>
          </div>
        ))}
      </div>

      {/* Marge brute */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {margeData.map(({ annee, marge }) => (
          <div key={annee} className="kpi-depth rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Marge brute {annee}</p>
            <p className="text-base font-bold text-positive font-mono">{marge}%</p>
          </div>
        ))}
      </div>

      {/* ── Services Extérieurs section ── */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/90 to-primary/70 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">Services Extérieurs — Détail complet</h2>
            <p className="text-white/70 text-xs mt-0.5">
              Total = <span className="font-mono font-semibold text-white">{(totalServExt * 100).toFixed(2)}%</span> du CA ·&nbsp;
              {formatFcfa(chargesExploitation[YEARS[0]].servicesExt, true)} en {YEARS[0]}
            </p>
          </div>
          <span className="text-white/60 text-[10px]">
            <Lock className="w-3 h-3 inline mr-1" />= montant fixe &nbsp;
            <Unlock className="w-3 h-3 inline mr-1" />= % CA
          </span>
        </div>

        {/* KPI mini-cards */}
        <div className="p-4 border-b border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-3">Montants {YEARS[0]} (première année)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES_EXT_LINES.map(({ key, label, tauxKey, fixedKey }) => {
              const isFixed = fixedKey ? (params[fixedKey] as number) > 0 : false;
              return (
                <div key={key} className={`rounded-lg p-3 border ${isFixed ? "bg-warning/5 border-warning/30" : "bg-muted/30 border-border/50"}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-base leading-none">{ICONS[key]}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
                    {isFixed && <Lock className="w-2.5 h-2.5 text-warning flex-shrink-0 ml-auto" />}
                  </div>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {formatFcfa((chargesExploitation[YEARS[0]] as any)[key], true)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isFixed
                      ? "montant fixe"
                      : tauxKey ? `${((params[tauxKey] as number) * 100).toFixed(2)}% du CA` : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editable taux/fixed inputs for services ext */}
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Ajuster les paramètres — cliquez sur <Lock className="w-3 h-3 inline text-warning" /> pour passer en montant fixe annuel
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES_EXT_LINES.map(def => (
              <div key={def.key}>
                <label className="text-xs text-muted-foreground block mb-1">{ICONS[def.key]} {def.label}</label>
                <EditableChargeRow def={def} params={params} ca2027={ca2027} updateParam={updateParam} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Other charges panel ── */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTaux(!showTaux)}
          className="w-full flex items-center justify-between px-5 py-3 bg-accent/10 hover:bg-accent/15 transition-colors"
        >
          <h3 className="text-sm font-semibold text-foreground">
            ⚙️ Autres Charges — Taux & Montants fixes
            {fixedCount > 0 && <span className="ml-2 text-[10px] bg-warning/20 text-warning px-2 py-0.5 rounded-full">{fixedCount} fixe(s)</span>}
          </h3>
          {showTaux ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showTaux && (
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Cliquez <Lock className="w-3 h-3 inline" /> pour figer un montant absolu — <Unlock className="w-3 h-3 inline" /> pour revenir en % du CA
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MAIN_LINES.filter(l => l.tauxKey && l.key !== "servicesExt").map(def => (
                <div key={def.key}>
                  <label className="text-xs text-muted-foreground block mb-1">{def.label}</label>
                  <EditableChargeRow def={def} params={params} ca2027={ca2027} updateParam={updateParam} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="header-gradient px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Détail des Charges par Année</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact exportName="Charges_Exploitation" />
      </div>
    </div>
  );
}
