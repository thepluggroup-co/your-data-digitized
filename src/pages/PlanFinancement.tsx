import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import {
  planFinancement, besoinsDurables, structureFinancement,
  actionnaires, categoriesActions, apportsProgressifs, gouvernance, roiParProfil,
  capitalConfig, YEARS, formatFcfa,
} from "@/lib/kenenergie-data";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  Users, Landmark, HandCoins, Building2, Shield, TrendingUp,
  Crown, Star, Briefcase, BadgeDollarSign, Handshake, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

const codeIcons: Record<string, React.ElementType> = {
  AF: Crown, AP: Star, A: BadgeDollarSign, B: Briefcase, APr: Shield, ACo: Handshake, "—": Building2,
};

const codeColors: Record<string, string> = {
  AF: "border-primary/30 bg-primary/5",
  AP: "border-accent/30 bg-accent/5",
  A: "border-blue-500/30 bg-blue-500/5",
  B: "border-foreground/20 bg-muted/50",
  APr: "border-yellow-500/30 bg-yellow-500/5",
  ACo: "border-green-500/30 bg-green-500/5",
  "—": "border-border bg-muted/30",
};

export default function PlanFinancement() {
  // ====== Plan de Financement Table ======
  const pfCols = [
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

  const pfRows = [
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

  // ====== Actionnariat table ======
  const actCols = [
    { key: "nom", label: "Actionnaire", align: "left" as const },
    { key: "numeraire", label: "Apport Numéraire", align: "right" as const },
    { key: "nature", label: "Apport Nature", align: "right" as const },
    { key: "actions", label: "Nb Actions", align: "right" as const },
    { key: "pct", label: "% Capital", align: "right" as const },
    { key: "type", label: "Type Actions", align: "left" as const },
  ];
  const actRows = actionnaires.filter(a => a.nbActions > 0 || a.apportNumeraire > 0 || a.profil === "Créancier").map(a => ({
    nom: a.nom,
    numeraire: a.apportNumeraire > 0 ? formatFcfa(a.apportNumeraire) : "—",
    nature: a.apportNature > 0 ? formatFcfa(a.apportNature) : "—",
    actions: a.nbActions > 0 ? a.nbActions.toLocaleString("fr-FR") : "—",
    pct: a.pctCapital > 0 ? a.pctCapital.toFixed(2) + "%" : "—",
    type: a.typeActions,
    _total: a.profil === "Créancier",
  }));

  // ====== Apports progressifs table ======
  const apCols = [
    { key: "acteur", label: "Partie Prenante", align: "left" as const },
    { key: "nature", label: "Nature de l'apport", align: "left" as const },
    { key: "n", label: "Année N (40%)", align: "right" as const },
    { key: "n2", label: "Année N+2 (63%)", align: "right" as const },
    { key: "n4", label: "Année N+4 (100%)", align: "right" as const },
  ];

  const internes = apportsProgressifs.filter(a => a.categorie === "interne");
  const externes = apportsProgressifs.filter(a => a.categorie === "externe");
  const strategiques = apportsProgressifs.filter(a => a.categorie === "strategique");

  const apRows: any[] = [
    { _section: true, _label: "🏛 PARTIES PRENANTES INTERNES" },
    ...internes.map(a => ({ acteur: a.acteur, nature: a.nature, n: formatFcfa(a.apportN), n2: formatFcfa(a.apportN2), n4: formatFcfa(a.apportN4), _sub: true })),
    { acteur: "Sous-total Internes", nature: "", n: formatFcfa(internes.reduce((s, a) => s + a.apportN, 0)), n2: formatFcfa(internes.reduce((s, a) => s + a.apportN2, 0)), n4: formatFcfa(internes.reduce((s, a) => s + a.apportN4, 0)), _total: true },
    { _section: true, _label: "🌐 PARTIES PRENANTES EXTERNES" },
    ...externes.map(a => ({ acteur: a.acteur, nature: a.nature, n: formatFcfa(a.apportN), n2: formatFcfa(a.apportN2), n4: formatFcfa(a.apportN4), _sub: true })),
    { acteur: "Sous-total Externes", nature: "", n: formatFcfa(externes.reduce((s, a) => s + a.apportN, 0)), n2: formatFcfa(externes.reduce((s, a) => s + a.apportN2, 0)), n4: formatFcfa(externes.reduce((s, a) => s + a.apportN4, 0)), _total: true },
    { _section: true, _label: "🤝 PARTENAIRES STRATÉGIQUES" },
    ...strategiques.map(a => ({ acteur: a.acteur, nature: a.nature, n: a.apportN > 0 ? formatFcfa(a.apportN) : "Partenariat", n2: a.apportN2 > 0 ? formatFcfa(a.apportN2) : "Partenariat", n4: a.apportN4 > 0 ? formatFcfa(a.apportN4) : "Partenariat", _sub: true })),
  ];

  // ====== Pie Chart ======
  const pieData = [
    { name: "Capital social", value: structureFinancement.capitalSocial.montant },
    { name: "Augmentation capital", value: structureFinancement.augmentationCapital.montant },
    { name: "Comptes courants", value: structureFinancement.comptesCourantsAssocies.montant },
    { name: "Emprunt bancaire", value: structureFinancement.empruntBancaire.montant },
    { name: "Autofinancement", value: structureFinancement.autofinancement.montant },
  ];

  const actionnairesPie = actionnaires.filter(a => a.nbActions > 0).map((a, i) => ({
    name: a.nom.split("(")[0].trim().split("/")[0].trim(),
    value: a.nbActions,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Plan de Financement & Ouverture du Capital"
        subtitle="Ressources & Emplois 5 ans — Valorisation des actifs en actions — Cartographie des parties prenantes"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Capital Total", value: formatFcfa(capitalConfig.capitalSocial + capitalConfig.augmentationCapital, true), icon: "💰" },
          { label: "Emprunt LT", value: formatFcfa(capitalConfig.empruntBancaireLT, true), icon: "🏦" },
          { label: "CA Plein Régime", value: formatFcfa(8_693_650_995, true), icon: "📈" },
          { label: "Résultat Net N+4", value: formatFcfa(2_844_477_607, true), icon: "✅" },
          { label: "TRI Projet", value: "34.87%", icon: "🏆" },
          { label: "Nb Actions", value: capitalConfig.nombreActions.toLocaleString("fr-FR"), icon: "🎯" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">{icon} {label}</p>
            <p className="text-sm font-bold text-primary font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <Tabs defaultValue="plan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="plan" className="text-xs py-2">📊 Plan Financement</TabsTrigger>
          <TabsTrigger value="actionnariat" className="text-xs py-2">📋 Actionnariat</TabsTrigger>
          <TabsTrigger value="apports" className="text-xs py-2">📅 Apports Progressifs</TabsTrigger>
          <TabsTrigger value="gouvernance" className="text-xs py-2">⚖️ Gouvernance</TabsTrigger>
          <TabsTrigger value="roi" className="text-xs py-2">📈 ROI</TabsTrigger>
        </TabsList>

        {/* TAB 1: Plan de Financement */}
        <TabsContent value="plan" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {YEARS.map((y) => (
              <div key={y} className="bg-card rounded-xl border border-border p-3 shadow-sm text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Trésorerie {y}</p>
                <p className={cn("text-sm font-bold font-mono", planFinancement[y].soldePeriode >= 0 ? "text-accent" : "text-destructive")}>
                  {formatFcfa(planFinancement[y].soldePeriode, true)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-primary-foreground font-semibold text-sm">Plan de Financement Prévisionnel (2027–2031)</h2>
            </div>
            <FinTable cols={pfCols} rows={pfRows} compact exportName="Plan_Financement" />
          </div>

          {/* Structure Financement Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary" /> Structure du Financement
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatFcfa(v, true)} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-3">
                {[
                  { label: "Ratio endettement", val: (structureFinancement.ratioEndettement * 100).toFixed(0) + "%" },
                  { label: "Ratio fonds propres", val: (structureFinancement.ratioFondsPropres * 100).toFixed(0) + "%" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Besoins vs Ressources Durables
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Investissements", montant: besoinsDurables.investissementTotal, pct: besoinsDurables.investissementTotal / besoinsDurables.totalBesoinsDurables * 100 },
                  { label: "Besoin en fonds de roulement", montant: besoinsDurables.besoinFondsRoulement, pct: besoinsDurables.besoinFondsRoulement / besoinsDurables.totalBesoinsDurables * 100 },
                ].map(({ label, montant, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold">{formatFcfa(montant, true)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary rounded-full h-2.5" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-border">
                  <span>Total besoins durables</span>
                  <span className="font-mono">{formatFcfa(besoinsDurables.totalBesoinsDurables, true)}</span>
                </div>
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/20 mt-2">
                  <p className="text-xs text-accent font-semibold">
                    ✓ Trésorerie cumulée fin 2031 : {formatFcfa(planFinancement[2031].tresorerieCumulee, true)} FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Actionnariat */}
        <TabsContent value="actionnariat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Actionnariat Pie */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Répartition Actionnariale</h3>
              <p className="text-[10px] text-muted-foreground mb-3">
                Capital : {formatFcfa(capitalConfig.capitalSocial + capitalConfig.augmentationCapital, true)} | Valeur nom. : {capitalConfig.valeurNominaleAction.toLocaleString("fr-FR")} FCFA/action | Coeff. nature : ×{capitalConfig.coefficientNature}
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={actionnairesPie} cx="50%" cy="50%" innerRadius={35} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {actionnairesPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString("fr-FR") + " actions"} />
                    <Legend wrapperStyle={{ fontSize: "9px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Actionnariat Table */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-primary px-5 py-3">
                <h2 className="text-primary-foreground font-semibold text-sm">Tableau d'Actionnariat — Valorisation des Actifs en Actions</h2>
              </div>
              <FinTable cols={actCols} rows={actRows} compact exportName="Actionnariat_KENENERGIE" />
            </div>
          </div>

          {/* Nomenclature des catégories d'actions */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-primary-foreground font-semibold text-sm">📋 Nomenclature des Catégories d'Actions — Droits & Conditions</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoriesActions.map((cat) => {
                const Icon = codeIcons[cat.code] || Shield;
                return (
                  <div key={cat.code} className={cn("rounded-xl border p-4 space-y-2", codeColors[cat.code])}>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-background/80">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold">{cat.code}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">— {cat.nom}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{cat.titulaires}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      <span className="text-muted-foreground">Vote</span><span className="font-medium">{cat.vote}</span>
                      <span className="text-muted-foreground">Dividende</span><span className="font-medium">{cat.dividende}</span>
                      <span className="text-muted-foreground">Liquidation</span><span className="font-medium">{cat.liquidation}</span>
                      <span className="text-muted-foreground">Cession</span><span className="font-medium">{cat.cession}</span>
                    </div>
                    <p className="text-[10px] italic text-muted-foreground border-t border-current/10 pt-1.5">{cat.condition}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionnaires Cards */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Parties Prenantes — Passeport de Valeur
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actionnaires.map((a) => {
                const Icon = codeIcons[a.codeActions] || Building2;
                return (
                  <div key={a.id} className={cn("rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow", codeColors[a.codeActions])}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-background/80 flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground leading-tight">{a.nom}</p>
                        <p className="text-[10px] text-muted-foreground">{a.profil}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-background/60 border border-current/10">
                        {a.typeActions}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      {a.apportNumeraire > 0 && (
                        <>
                          <span className="text-muted-foreground">Numéraire</span>
                          <span className="font-mono font-semibold text-right">{formatFcfa(a.apportNumeraire, true)}</span>
                        </>
                      )}
                      {a.apportNature > 0 && (
                        <>
                          <span className="text-muted-foreground">Nature (actifs)</span>
                          <span className="font-mono font-semibold text-right">{formatFcfa(a.apportNature, true)}</span>
                        </>
                      )}
                      {a.valeurActionsNature > 0 && (
                        <>
                          <span className="text-muted-foreground">Valorisé (×1.5)</span>
                          <span className="font-mono font-semibold text-right">{formatFcfa(a.valeurActionsNature, true)}</span>
                        </>
                      )}
                      {a.nbActions > 0 && (
                        <>
                          <span className="text-muted-foreground">Actions</span>
                          <span className="font-mono font-bold text-right">{a.nbActions.toLocaleString("fr-FR")}</span>
                        </>
                      )}
                      {a.pctCapital > 0 && (
                        <>
                          <span className="text-muted-foreground">% Capital</span>
                          <span className="font-mono font-bold text-primary text-right">{a.pctCapital.toFixed(2)}%</span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] italic text-muted-foreground border-t border-current/10 pt-2">{a.droitsClauses}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: Apports Progressifs */}
        <TabsContent value="apports" className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted-foreground">
              Les apports des parties prenantes sont <strong>directement proportionnels aux taux d'activité</strong> : N = 40% → N+2 = 63% → N+4 = 100%.
              Ce mécanisme assure une montée en charge progressive alignée sur les besoins durables et les investissements.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Année N (40%)", val: apportsProgressifs.reduce((s, a) => s + a.apportN, 0) },
              { label: "Année N+2 (63%)", val: apportsProgressifs.reduce((s, a) => s + a.apportN2, 0) },
              { label: "Année N+4 (100%)", val: apportsProgressifs.reduce((s, a) => s + a.apportN4, 0) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-base font-bold text-primary font-mono">{formatFcfa(val, true)}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-primary-foreground font-semibold text-sm">Plan d'Apport Progressif des Parties Prenantes</h2>
            </div>
            <FinTable cols={apCols} rows={apRows} compact exportName="Apports_Progressifs" />
          </div>
        </TabsContent>

        {/* TAB 4: Gouvernance */}
        <TabsContent value="gouvernance" className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Structure de Gouvernance
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {gouvernance.map((g) => (
                <div key={g.organe} className="rounded-xl border border-border p-4 space-y-2 hover:shadow-sm transition-shadow">
                  <h3 className="text-sm font-bold text-foreground">{g.organe}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground font-semibold mb-0.5">Composition</p>
                      <p className="text-foreground">{g.composition}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold mb-0.5">Fréquence</p>
                      <p className="text-foreground">{g.frequence}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold mb-0.5">Attributions</p>
                      <p className="text-foreground">{g.attributions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: ROI */}
        <TabsContent value="roi" className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-5 py-3">
              <h2 className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Retour sur Investissement par Profil — Synthèse Comparative
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roiParProfil.map((r) => (
                  <div key={r.acteur} className="rounded-xl border border-border p-4 space-y-3 bg-muted/20 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="text-xs font-bold text-foreground">{r.acteur}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                      <span className="text-muted-foreground">Apport total</span>
                      <span className="font-mono font-semibold text-right">{formatFcfa(r.apportTotal, true)}</span>
                      {r.dividendesCumules > 0 && (
                        <>
                          <span className="text-muted-foreground">Intérêts/Dividendes</span>
                          <span className="font-mono font-semibold text-right">{formatFcfa(r.dividendesCumules, true)}</span>
                        </>
                      )}
                      {r.plusValueEstimee > 0 && (
                        <>
                          <span className="text-muted-foreground">Plus-value estimée</span>
                          <span className="font-mono font-semibold text-accent text-right">{formatFcfa(r.plusValueEstimee, true)}</span>
                        </>
                      )}
                      <span className="text-muted-foreground font-semibold">Retour total 5 ans</span>
                      <span className="font-mono font-bold text-primary text-right">{formatFcfa(r.retourTotal, true)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-[10px] text-muted-foreground">ROI 5 ans</span>
                      <span className="text-sm font-bold text-accent font-mono">{r.roiPct.toFixed(1)}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">⏱ Délai retour : {r.delaiRetour}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
