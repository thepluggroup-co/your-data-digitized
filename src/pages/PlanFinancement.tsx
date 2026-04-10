import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import {
  planFinancement, besoinsDurables, structureFinancement, stakeholders,
  YEARS, formatFcfa,
} from "@/lib/kenenergie-data";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Landmark, HandCoins, Handshake, Leaf, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

const typeColors: Record<string, string> = {
  equity: "bg-primary/10 text-primary border-primary/20",
  debt: "bg-destructive/10 text-destructive border-destructive/20",
  grant: "bg-accent/10 text-accent border-accent/20",
  operational: "bg-muted text-muted-foreground border-border",
};

const typeLabels: Record<string, string> = {
  equity: "Fonds propres",
  debt: "Dette",
  grant: "Subvention / Partenariat",
  operational: "Opérationnel",
};

const typeIcons: Record<string, React.ElementType> = {
  equity: Users,
  debt: Landmark,
  grant: Leaf,
  operational: Handshake,
};

export default function PlanFinancement() {
  // ====== Table Plan de Financement ======
  const cols = [
    { key: "label", label: "Rubrique", align: "left" as const },
    ...YEARS.map((y) => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
    { key: "cumul", label: "Cumul", align: "right" as const },
  ];

  const makeRow = (label: string, fn: (y: number) => number, opts?: { total?: boolean; sub?: boolean }) => {
    const cumul = YEARS.reduce((s, y) => s + fn(y), 0);
    return {
      label,
      ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(fn(y))])),
      cumul: formatFcfa(cumul),
      _total: opts?.total,
      _sub: opts?.sub,
    };
  };

  const rows = [
    { _section: true, _label: "RESSOURCES" },
    makeRow("Capacité d'autofinancement (CAF)", (y) => planFinancement[y].caf, { sub: true }),
    makeRow("Capital social", (y) => planFinancement[y].capitalSocial, { sub: true }),
    makeRow("Augmentation de capital", (y) => planFinancement[y].augmentationCapital, { sub: true }),
    makeRow("Emprunts à long terme", (y) => planFinancement[y].empruntsLT, { sub: true }),
    makeRow("Comptes courants d'associés", (y) => planFinancement[y].comptesCourantsAssocies, { sub: true }),
    makeRow("TOTAL RESSOURCES", (y) => planFinancement[y].totalRessources, { total: true }),
    { _section: true, _label: "EMPLOIS" },
    makeRow("Investissements", (y) => planFinancement[y].investissements, { sub: true }),
    makeRow("Remboursement emprunts", (y) => planFinancement[y].remboursementEmprunt, { sub: true }),
    makeRow("Dividendes distribués", (y) => planFinancement[y].dividendes, { sub: true }),
    makeRow("Variation du BFR", (y) => planFinancement[y].variationBFR, { sub: true }),
    makeRow("TOTAL EMPLOIS", (y) => planFinancement[y].totalEmplois, { total: true }),
    { _section: true, _label: "SOLDE" },
    makeRow("Solde de la période", (y) => planFinancement[y].soldePeriode, { sub: true }),
    makeRow("Trésorerie cumulée", (y) => planFinancement[y].tresorerieCumulee, { total: true }),
  ];

  // ====== Pie Chart structure financement ======
  const pieData = [
    { name: "Capital social", value: structureFinancement.capitalSocial.montant },
    { name: "Augmentation capital", value: structureFinancement.augmentationCapital.montant },
    { name: "Comptes courants", value: structureFinancement.comptesCourantsAssocies.montant },
    { name: "Emprunt bancaire", value: structureFinancement.empruntBancaire.montant },
    { name: "Autofinancement", value: structureFinancement.autofinancement.montant },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Plan de Financement & Ouverture de Capital"
        subtitle="Ressources & Emplois sur 5 ans – Structure de capital proportionnelle aux besoins durables"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Besoins durables</p>
          <p className="text-base font-bold text-primary font-mono">{formatFcfa(besoinsDurables.totalBesoinsDurables, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Investissement total</p>
          <p className="text-base font-bold text-foreground font-mono">{formatFcfa(besoinsDurables.investissementTotal, true)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Ratio endettement</p>
          <p className="text-base font-bold text-destructive font-mono">{(structureFinancement.ratioEndettement * 100).toFixed(0)}%</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Trésorerie fin 2031</p>
          <p className="text-base font-bold text-accent font-mono">{formatFcfa(planFinancement[2031].tresorerieCumulee, true)}</p>
        </div>
      </div>

      {/* Plan de financement table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Plan de Financement Prévisionnel (2027–2031)</h2>
        </div>
        <FinTable cols={cols} rows={rows} compact exportName="Plan_Financement" />
      </div>

      {/* ====== SECTION: Ouverture de Capital ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Structure de financement */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="bg-primary px-5 py-3">
            <h2 className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
              <HandCoins className="w-4 h-4" />
              Structure du Financement
            </h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-muted-foreground mb-4">
              Répartition proportionnelle aux besoins durables de <strong>{formatFcfa(besoinsDurables.totalBesoinsDurables, true)} FCFA</strong>
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatFcfa(v, true)} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {[
                { label: "Capital social", val: structureFinancement.capitalSocial, color: COLORS[0] },
                { label: "Augmentation capital", val: structureFinancement.augmentationCapital, color: COLORS[1] },
                { label: "Comptes courants associés", val: structureFinancement.comptesCourantsAssocies, color: COLORS[2] },
                { label: "Emprunt bancaire LT", val: structureFinancement.empruntBancaire, color: COLORS[3] },
                { label: "Autofinancement (CAF)", val: structureFinancement.autofinancement, color: COLORS[4] },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{formatFcfa(val.montant, true)}</span>
                    <span className="text-muted-foreground w-12 text-right">{val.pctTotal.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Besoins durables vs ressources */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="bg-primary px-5 py-3">
            <h2 className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Adéquation Besoins / Ressources Durables
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Besoins durables</h3>
              <div className="space-y-2">
                {[
                  { label: "Investissements (immobilisations)", montant: besoinsDurables.investissementTotal, pct: (besoinsDurables.investissementTotal / besoinsDurables.totalBesoinsDurables * 100) },
                  { label: "Besoin en fonds de roulement (BFR)", montant: besoinsDurables.besoinFondsRoulement, pct: (besoinsDurables.besoinFondsRoulement / besoinsDurables.totalBesoinsDurables * 100) },
                ].map(({ label, montant, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold">{formatFcfa(montant, true)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-border">
                  <span>Total besoins durables</span>
                  <span className="font-mono">{formatFcfa(besoinsDurables.totalBesoinsDurables, true)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Ressources durables</h3>
              <div className="space-y-2">
                {[
                  { label: "Fonds propres (Capital + Augmentation)", montant: 410_000_000 + 1_000_000_000 },
                  { label: "Emprunt bancaire LT", montant: 5_000_000_000 },
                  { label: "Autofinancement prévisionnel", montant: 1_679_669_634 },
                ].map(({ label, montant }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-semibold">{formatFcfa(montant, true)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-border">
                  <span>Total ressources durables</span>
                  <span className="font-mono text-accent">{formatFcfa(structureFinancement.totalRessourcesDurables, true)}</span>
                </div>
              </div>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-xs text-accent font-semibold">
                ✓ Couverture des besoins : les ressources durables couvrent 100% des besoins durables avec un excédent de trésorerie cumulé de {formatFcfa(planFinancement[2031].tresorerieCumulee, true)} en fin de période.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== SECTION: Acteurs Potentiels / Parties Prenantes ====== */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Acteurs Potentiels & Parties Prenantes
          </h2>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-5">
            Identification des parties prenantes et leur contribution proportionnelle aux investissements et besoins durables du projet.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stakeholders.map((s) => {
              const Icon = typeIcons[s.type] || Users;
              return (
                <div
                  key={s.acteur}
                  className={cn(
                    "rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md",
                    typeColors[s.type]
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-background/80 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{s.categorie}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{s.acteur}</p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/60 border border-current/10">
                      {typeLabels[s.type]}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{s.description}</p>
                  {s.montant > 0 && (
                    <div className="pt-2 border-t border-current/10">
                      <p className="text-xs">
                        <span className="text-muted-foreground">Contribution :</span>{" "}
                        <span className="font-bold font-mono">{formatFcfa(s.montant, true)} FCFA</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(s.montant / besoinsDurables.totalBesoinsDurables * 100).toFixed(1)}% des besoins durables
                      </p>
                    </div>
                  )}
                  {s.montant === 0 && (
                    <div className="pt-2 border-t border-current/10">
                      <p className="text-[11px] italic text-muted-foreground">{s.contribution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
