import { useParametres } from "@/contexts/ParametresContext";
import { YEARS } from "@/lib/kenenergie-data";
import logoThePlug from "@/assets/logo-the-plug.png";

/**
 * TABLEAU DE BORD FINANCIER BANQUIER — réplique fidèle de la feuille Excel
 * "TABLEAU DE BORD" du dossier KENENERGIE × THE PLUG IT SOLUTIONS.
 *
 * Six blocs :
 *  1. Compte de Résultat (CA, VA, EBE, RE, Charges fin., RN, CAF + taux)
 *  2. Bilan (Immo, AC, Tréso, CP, Dettes, PC + équilibre)
 *  3. Ratios bancaires (Autonomie, Levier, ROE, ROA, Dettes/CAF)
 *  4. Liquidité & BFR (FRN, BFR, Trésorerie nette, Liquidité générale)
 *  5. DSCR par année (N+1 → N+5)
 *  6. Rentabilité projet (TRI, VAN @10%, Investissement)
 */
export default function TableauDeBordBanquier() {
  const { computed, params } = useParametres();
  const { resultats, bilan, banking, vanTirMetrics, planFinancement } = computed;

  const cols = YEARS.map((_, i) => `N${i === 0 ? "" : "+" + i}`);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const mds = (v: number) => (v / 1e9).toFixed(3);
  const pct = (v: number) => `${v.toFixed(1)}%`;
  const ratio = (v: number) => `${v.toFixed(2)}`;

  type Row =
    | { kind: "section"; label: string }
    | { kind: "data"; label: string; values: (string | number)[]; emphasis?: "total" | "ratio"; highlight?: boolean }
    | { kind: "single"; label: string; value: string | number; col: number; emphasis?: boolean };

  // ── Bloc 1 — Compte de Résultat ──────────────────────────────────────────
  const cr: Row[] = [
    { kind: "section", label: "COMPTE DE RÉSULTAT (FCFA Mrd)" },
    { kind: "data", label: "Chiffre d'Affaires", values: YEARS.map(y => mds(resultats[y].ventes)), emphasis: "total" },
    { kind: "data", label: "Valeur Ajoutée", values: YEARS.map(y => mds(banking[y].valeurAjoutee)) },
    { kind: "data", label: "Taux VA/CA", values: YEARS.map(y => pct(banking[y].margeVa)), emphasis: "ratio" },
    { kind: "data", label: "EBE (Excédent Brut Exploit.)", values: YEARS.map(y => mds(banking[y].ebe)) },
    { kind: "data", label: "Taux EBE/CA", values: YEARS.map(y => pct(banking[y].margeEbe)), emphasis: "ratio" },
    { kind: "data", label: "Dotations aux Amortissements", values: YEARS.map(y => mds(resultats[y].amortissements)) },
    { kind: "data", label: "Résultat d'Exploitation", values: YEARS.map(y => mds(resultats[y].beneficeExploitation)) },
    { kind: "data", label: "Taux RE/CA", values: YEARS.map(y => pct(resultats[y].resultatBrutVentes)), emphasis: "ratio" },
    { kind: "data", label: "Charges Financières", values: YEARS.map(y => mds(resultats[y].interets)) },
    { kind: "data", label: "Résultat Net", values: YEARS.map(y => mds(resultats[y].beneficeNet)), emphasis: "total" },
    { kind: "data", label: "Marge Nette", values: YEARS.map(y => pct(resultats[y].resultatNetVentes)), emphasis: "ratio" },
    { kind: "data", label: "CAF (Capacité Autofinancement)", values: YEARS.map(y => mds(resultats[y].caf)), emphasis: "total" },
  ];

  // ── Bloc 2 — Bilan ────────────────────────────────────────────────────────
  const equilibre = YEARS.map(y => Math.abs(bilan[y].totalActif - bilan[y].totalPassif) < 1_000_000 ? "✅" : "⚠️");
  const bilanRows: Row[] = [
    { kind: "section", label: "BILAN (FCFA Mrd)" },
    { kind: "data", label: "Immobilisations Nettes", values: YEARS.map(y => mds(bilan[y].actifImmo)) },
    { kind: "data", label: "Actif Circulant", values: YEARS.map(y => mds(bilan[y].actifCirculant)) },
    { kind: "data", label: "Trésorerie Actif", values: YEARS.map(y => mds(bilan[y].tresorerieActif)) },
    { kind: "data", label: "TOTAL ACTIF", values: YEARS.map(y => mds(bilan[y].totalActif)), emphasis: "total" },
    { kind: "data", label: "Capitaux Propres", values: YEARS.map(y => mds(bilan[y].capitauxPropres)) },
    { kind: "data", label: "Dettes Financières", values: YEARS.map(y => mds(bilan[y].dettesFinancieres)) },
    { kind: "data", label: "Passif Circulant", values: YEARS.map(y => mds(bilan[y].passifCirculant)) },
    { kind: "data", label: "TOTAL PASSIF", values: YEARS.map(y => mds(bilan[y].totalPassif)), emphasis: "total" },
    { kind: "data", label: "Bilan Équilibré", values: equilibre, highlight: true },
  ];

  // ── Bloc 3 — Ratios bancaires ────────────────────────────────────────────
  const ratios: Row[] = [
    { kind: "section", label: "RATIOS BANCAIRES" },
    { kind: "data", label: "Autonomie Financière (CP/Actif)", values: YEARS.map(y => pct(banking[y].autonomie * 100)), emphasis: "ratio" },
    { kind: "data", label: "Levier Dettes/CP", values: YEARS.map(y => pct(banking[y].dettesCp * 100)), emphasis: "ratio" },
    { kind: "data", label: "ROE (Résultat Net/CP)", values: YEARS.map(y => bilan[y].capitauxPropres > 0 ? pct((resultats[y].beneficeNet / bilan[y].capitauxPropres) * 100) : "—"), emphasis: "ratio" },
    { kind: "data", label: "ROA (Résultat Net/Actif)", values: YEARS.map(y => pct(banking[y].roa)), emphasis: "ratio" },
    { kind: "data", label: "Dettes/CAF (années)", values: YEARS.map(y => ratio(banking[y].dettesCaf)), emphasis: "ratio" },
  ];

  // ── Bloc 4 — Liquidité & BFR ─────────────────────────────────────────────
  const liquidite: Row[] = [
    { kind: "section", label: "LIQUIDITÉ & BFR" },
    { kind: "data", label: "Fonds de Roulement Net", values: YEARS.map(y => mds(banking[y].frn)) },
    { kind: "data", label: "Besoin en Fonds de Roulement", values: YEARS.map(y => mds(bilan[y].actifCirculant - bilan[y].passifCirculant)) },
    { kind: "data", label: "Trésorerie Nette", values: YEARS.map(y => mds(banking[y].tresoNette)) },
    { kind: "data", label: "Liquidité Générale (AC+T)/PC", values: YEARS.map(y => ratio(vanTirMetrics.liquidite[y])), emphasis: "ratio" },
  ];

  // ── Bloc 5 — DSCR par année ──────────────────────────────────────────────
  const dscrRows: Row[] = [
    { kind: "section", label: "DSCR & COUVERTURE DETTE" },
    ...YEARS.map((y, i) => ({
      kind: "single" as const,
      label: `DSCR N${i === 0 ? "" : "+" + i}`,
      value: ratio(banking[y].dscrEbe),
      col: i,
      emphasis: true,
    })),
  ];

  // ── Bloc 6 — Rentabilité projet ──────────────────────────────────────────
  const rentRows: Row[] = [
    { kind: "section", label: "RENTABILITÉ PROJET" },
    { kind: "single", label: "TRI (Taux Rentabilité Interne)", value: pct(vanTirMetrics.irr * 100), col: 0, emphasis: true },
    { kind: "single", label: "VAN (actualisation 10%)", value: mds(vanTirMetrics.van10), col: 0 },
    { kind: "single", label: "Investissement Initial (Mrd)", value: mds(vanTirMetrics.investissementTotal), col: 0 },
  ];

  const allRows = [...cr, ...bilanRows, ...ratios, ...liquidite, ...dscrRows, ...rentRows];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="kpi-depth rounded-xl border border-border overflow-hidden">
      {/* En-tête style Excel */}
      <div className="header-gradient px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-primary-foreground font-bold text-sm uppercase tracking-wide truncate">
            {(params.companyName?.trim() || "VOTRE ENTREPRISE")} · TABLEAU DE BORD FINANCIER BANQUIER
          </h2>
          <p className="text-primary-foreground/70 text-[11px] mt-0.5">
            Analyse prévisionnelle 5 ans — Système OHADA / SYSCOHADA
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src={logoThePlug} alt="THE PLUG" className="w-8 h-8 object-contain drop-shadow" />
          <div className="text-right">
            <p className="text-white font-bold text-[11px] tracking-wider">THE PLUG IT SOLUTIONS</p>
            <p className="text-white/60 text-[9px]">Connexion that drives innovation</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-semibold text-foreground w-[280px]">INDICATEUR</th>
              {cols.map(c => (
                <th key={c} className="text-right px-3 py-2 font-semibold text-foreground">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, i) => {
              if (row.kind === "section") {
                return (
                  <tr key={i} className="bg-primary/10 border-y border-primary/30">
                    <td colSpan={6} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                      {row.label}
                    </td>
                  </tr>
                );
              }
              if (row.kind === "single") {
                return (
                  <tr key={i} className="row-lift border-b border-border/40">
                    <td className="px-4 py-1.5 font-medium text-foreground">{row.label}</td>
                    {cols.map((_, ci) => (
                      <td key={ci} className={`text-right px-3 py-1.5 font-mono ${ci === row.col ? (row.emphasis ? "font-bold text-accent text-sm" : "font-semibold text-foreground") : "text-muted-foreground/30"}`}>
                        {ci === row.col ? row.value : "—"}
                      </td>
                    ))}
                  </tr>
                );
              }
              const cls =
                row.emphasis === "total" ? "font-bold text-foreground bg-muted/20" :
                row.emphasis === "ratio" ? "italic text-accent" :
                "text-foreground";
              return (
                <tr key={i} className={`row-lift border-b border-border/40 ${row.highlight ? "bg-emerald-500/5" : ""}`}>
                  <td className={`px-4 py-1.5 ${row.emphasis === "total" ? "font-bold" : "font-medium"} text-foreground`}>{row.label}</td>
                  {row.values.map((v, ci) => (
                    <td key={ci} className={`text-right px-3 py-1.5 font-mono ${cls}`}>{v}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Note méthodologique OHADA */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 text-[10px] text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Note OHADA :</span> Liquidité calculée hors CCA (dette subordonnée non exigible).
        DSCR sur base EBE / Service de la dette. Charges variables exclues de la VA.
        Total Financement : <span className="font-mono text-foreground">{mds(computed.totalFinancement)} Mrd</span> ·
        Capacité d'endettement (Capital + CCA × {params.ccCaptalMultiplier}) : <span className="font-mono text-foreground">{mds(computed.capaciteEndettement)} Mrd</span> ·
        Apport personnel : <span className="font-mono text-foreground">{(computed.tauxApportPersonnel * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}
