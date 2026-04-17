/**
 * Moteur de recommandations financières — THE PLUG FINANCE CO
 * Analyse les points critiques et génère des ajustements paramétriques
 * spécifiquement calibrés pour KENENERGIE SARL (premier projet de référence)
 */

import { YEARS } from "@/lib/kenenergie-data";
import type { ComputedModel, EditableParams } from "@/contexts/ParametresContext";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Severity = "critical" | "major" | "minor";
export type Category =
  | "solvabilite"
  | "liquidite"
  | "rentabilite"
  | "structure_capital"
  | "remboursement"
  | "croissance"
  | "charges";

export interface Issue {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  description: string;
  affectedYears: number[];
  currentValue: string;
  targetValue: string;
}

export interface Recommandation {
  id: string;
  priority: 1 | 2 | 3;            // 1 = urgent
  issueIds: string[];
  titre: string;
  detail: string;
  parametre?: keyof EditableParams;
  valeurActuelle?: number;
  valeurSuggeree?: number;
  deltaPct?: number;               // % de variation suggérée
  impactAttendu: string;
  effort: "immédiat" | "court terme" | "moyen terme";
  categorie: Category;
  kpi: string;                     // KPI cible principal
  gainEstime?: string;             // ex: "+0.4× DSCR"
}

export interface AnalysisResult {
  issues: Issue[];
  recommandations: Recommandation[];
  scoreAvant: number;
  notes: string[];
  profil: "BANCABLE" | "A_CONSOLIDER" | "NON_BANCABLE";
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(v: number) {
  if (Math.abs(v) >= 1e9)  return `${(v / 1e9).toFixed(3)} Mds FCFA`;
  if (Math.abs(v) >= 1e6)  return `${(v / 1e6).toFixed(0)} M FCFA`;
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

// ── Core algorithm ────────────────────────────────────────────────────────────
export function analyzeAndRecommend(
  computed: ComputedModel,
  params: EditableParams,
): AnalysisResult {
  const { resultats, bilan, chargesExploitation, banking, vanTirMetrics } = computed;
  const issues: Issue[] = [];
  const recommandations: Recommandation[] = [];
  const notes: string[] = [];

  // ── Scoring helpers ──────────────────────────────────────────────────────
  let score = 0;

  // ── 1. DSCR (EBE-based) ──────────────────────────────────────────────────
  const dscrByYear = YEARS.map(y => ({ y, v: banking[y].dscrEbe }));
  const dscrCritical = dscrByYear.filter(d => d.v < 1.0);
  const dscrMajor    = dscrByYear.filter(d => d.v >= 1.0 && d.v < 1.3);
  const avgDSCR = YEARS.reduce((s, y) => s + banking[y].dscrEbe, 0) / YEARS.length;

  if (avgDSCR >= 1.3) score += 25;
  else if (avgDSCR >= 1.0) score += 12;

  if (dscrCritical.length > 0) {
    issues.push({
      id: "DSCR_CRITICAL",
      severity: "critical",
      category: "remboursement",
      title: "DSCR inférieur à 1,0 — risque de défaut",
      description: `Le ratio de couverture du service de la dette (EBE / Service de la dette) est inférieur à 1,0 sur ${dscrCritical.length} année(s). Le projet ne génère pas suffisamment de trésorerie pour couvrir ses obligations.`,
      affectedYears: dscrCritical.map(d => d.y),
      currentValue: `Min ${Math.min(...dscrCritical.map(d => d.v)).toFixed(2)}×`,
      targetValue: "≥ 1,3×",
    });
  } else if (dscrMajor.length > 0) {
    issues.push({
      id: "DSCR_MAJOR",
      severity: "major",
      category: "remboursement",
      title: "DSCR insuffisant (1,0 < DSCR < 1,3)",
      description: `Le DSCR se situe dans la zone de tolérance basse sur ${dscrMajor.length} année(s). La banque exige généralement un minimum de 1,3× comme marge de sécurité.`,
      affectedYears: dscrMajor.map(d => d.y),
      currentValue: `Moy. ${avgDSCR.toFixed(2)}×`,
      targetValue: "≥ 1,3×",
    });
  }

  // Recommendation for DSCR issue
  if (dscrCritical.length > 0 || dscrMajor.length > 0) {
    const endettementSuggere = Math.round(params.endettementLT * 0.80 / 100_000_000) * 100_000_000;
    const activiteSuggereN = Math.min(1.2, params.niveauxActivite[0] * 1.15);
    recommandations.push({
      id: "REC_DSCR_ENDETTEMENT",
      priority: dscrCritical.length > 0 ? 1 : 2,
      issueIds: ["DSCR_CRITICAL", "DSCR_MAJOR"],
      titre: "Réduire l'endettement LT ou allonger la durée",
      detail: `L'endettement LT actuel de ${fmt(params.endettementLT)} génère un service de la dette trop lourd dès les premières années. Réduire de 20% ramènerait l'annuité à un niveau compatible avec l'EBE projeté. Alternative : négocier un différé d'amortissement de 2 ans (N et N+1 en franchise totale).`,
      parametre: "endettementLT",
      valeurActuelle: params.endettementLT,
      valeurSuggeree: endettementSuggere,
      deltaPct: -20,
      impactAttendu: `Réduction du service annuel de ~${fmt(params.endettementLT * 0.08 * 0.20)}, gain DSCR estimé +0.3× à +0.5×`,
      effort: "court terme",
      categorie: "remboursement",
      kpi: "DSCR",
      gainEstime: "+0.3× à +0.5×",
    });

    recommandations.push({
      id: "REC_DSCR_ACTIVITE",
      priority: 2,
      issueIds: ["DSCR_CRITICAL", "DSCR_MAJOR"],
      titre: "Accélérer la montée en charge opérationnelle",
      detail: `Augmenter le niveau d'activité de l'année N de ${(params.niveauxActivite[0] * 100).toFixed(0)}% à ${(activiteSuggereN * 100).toFixed(0)}% (+15%) en mobilisant plus rapidement les équipes et la capacité installée. Pour KENENERGIE, cela signifie démarrer simultanément les chantiers Infra et Production dès le premier trimestre.`,
      parametre: "niveauxActivite",
      valeurActuelle: params.niveauxActivite[0],
      valeurSuggeree: activiteSuggereN,
      deltaPct: 15,
      impactAttendu: `Hausse du CA N de ~${(params.niveauxActivite[0] * 100).toFixed(0)}% → ${(activiteSuggereN * 100).toFixed(0)}%, EBE en hausse proportionnelle`,
      effort: "immédiat",
      categorie: "croissance",
      kpi: "DSCR / CA",
      gainEstime: "+15% CA N",
    });
  }

  // ── 2. Autonomie financière ──────────────────────────────────────────────
  const autonomieByYear = YEARS.map(y => ({ y, v: banking[y].autonomie }));
  const autonomieLow = autonomieByYear.filter(d => d.v < 0.20);
  const avgAutonomie = YEARS.reduce((s, y) => s + banking[y].autonomie, 0) / YEARS.length;

  if (avgAutonomie >= 0.25) score += 20;
  else if (avgAutonomie >= 0.15) score += 10;

  if (autonomieLow.length > 0) {
    issues.push({
      id: "AUTONOMIE_LOW",
      severity: autonomieLow.length >= 3 ? "critical" : "major",
      category: "structure_capital",
      title: "Autonomie financière insuffisante",
      description: `Les capitaux propres représentent moins de 20% du bilan total sur ${autonomieLow.length} exercice(s). L'effet de levier est excessif par rapport aux fonds propres disponibles.`,
      affectedYears: autonomieLow.map(d => d.y),
      currentValue: `Min ${(Math.min(...autonomieLow.map(d => d.v)) * 100).toFixed(1)}%`,
      targetValue: "≥ 25%",
    });

    const augCapSuggere = Math.round(params.augmentationCapital * 1.50 / 50_000_000) * 50_000_000;
    recommandations.push({
      id: "REC_AUTONOMIE_CAPITAL",
      priority: autonomieLow.length >= 3 ? 1 : 2,
      issueIds: ["AUTONOMIE_LOW"],
      titre: "Renforcer l'apport en fonds propres",
      detail: `L'augmentation de capital actuelle de ${fmt(params.augmentationCapital)} est insuffisante face à l'endettement de ${fmt(params.endettementLT)}. Porter l'augmentation à ${fmt(augCapSuggere)} (ratio fonds propres/dette cible : 1/3) améliorerait structurellement l'autonomie. Pour KENENERGIE, cela peut passer par l'entrée d'un investisseur stratégique dans le secteur énergie ou un fonds d'investissement CEMAC.`,
      parametre: "augmentationCapital",
      valeurActuelle: params.augmentationCapital,
      valeurSuggeree: augCapSuggere,
      deltaPct: 50,
      impactAttendu: `Autonomie financière N → ${((params.augmentationCapital + augCapSuggere - params.augmentationCapital) / (bilan[YEARS[0]].totalActif) * 100 + avgAutonomie * 100).toFixed(1)}%+`,
      effort: "moyen terme",
      categorie: "structure_capital",
      kpi: "Autonomie financière",
      gainEstime: "+5% à +8% autonomie",
    });
  }

  // ── 3. Levier financier ──────────────────────────────────────────────────
  const levierByYear = YEARS.map(y => ({ y, v: vanTirMetrics.levier[y] }));
  const levierHigh = levierByYear.filter(d => d.v > 5);
  const levierWarn = levierByYear.filter(d => d.v > 3 && d.v <= 5);

  if (levierHigh.length > 0) {
    issues.push({
      id: "LEVIER_HIGH",
      severity: "critical",
      category: "solvabilite",
      title: "Levier financier excessif (> 5×)",
      description: `Le ratio Dettes LT / EBITDA dépasse 5× sur ${levierHigh.length} exercice(s). Ce niveau indique une structure financière très fragile, difficilement acceptable pour une banque commerciale.`,
      affectedYears: levierHigh.map(d => d.y),
      currentValue: `Max ${Math.max(...levierHigh.map(d => d.v)).toFixed(2)}×`,
      targetValue: "≤ 3×",
    });
  } else if (levierWarn.length > 0) {
    issues.push({
      id: "LEVIER_WARN",
      severity: "major",
      category: "solvabilite",
      title: "Levier financier élevé (3× < Levier < 5×)",
      description: `Le levier se situe dans la zone d'alerte sur ${levierWarn.length} exercice(s). Une dégradation de l'EBITDA ferait franchir le seuil critique de 5×.`,
      affectedYears: levierWarn.map(d => d.y),
      currentValue: `Moy. ${(YEARS.reduce((s, y) => s + vanTirMetrics.levier[y], 0) / YEARS.length).toFixed(2)}×`,
      targetValue: "≤ 3×",
    });
  }

  if (levierHigh.length > 0 || levierWarn.length > 0) {
    recommandations.push({
      id: "REC_LEVIER",
      priority: levierHigh.length > 0 ? 1 : 2,
      issueIds: ["LEVIER_HIGH", "LEVIER_WARN"],
      titre: "Optimiser la structure de financement (dette/capital)",
      detail: `Pour KENENERGIE, une structure cible serait : 30% fonds propres (capital + augmentation), 50% dette LT, 20% quasi-fonds propres (comptes courants). Cela implique soit de réduire l'endettement LT à ${fmt(Math.round(params.endettementLT * 0.7 / 100_000_000) * 100_000_000)}, soit d'augmenter simultanément le capital à ${fmt(Math.round(params.augmentationCapital * 2 / 50_000_000) * 50_000_000)}.`,
      impactAttendu: "Levier ramené à 2,5×–3,5× sur l'ensemble de la période",
      effort: "moyen terme",
      categorie: "solvabilite",
      kpi: "Levier Dettes/EBITDA",
      gainEstime: "-2× levier",
    });
  }

  // ── 4. ICR (Interest Coverage Ratio) ────────────────────────────────────
  const icrByYear = YEARS.map(y => ({ y, v: vanTirMetrics.icr[y] ?? 0 }));
  const icrLow = icrByYear.filter(d => d.v < 2.5);

  if (icrLow.length >= 2) {
    issues.push({
      id: "ICR_LOW",
      severity: icrLow.length >= 3 ? "major" : "minor",
      category: "remboursement",
      title: "Couverture des intérêts insuffisante (ICR < 2,5×)",
      description: `Le bénéfice d'exploitation ne couvre les frais financiers que ${(icrLow[0]?.v ?? 0).toFixed(1)}× (norme : 2,5×). Le taux d'intérêt de ${(params.txInteretEmpruntLT * 100).toFixed(1)}% génère des charges financières trop lourdes relativement à l'exploitation.`,
      affectedYears: icrLow.map(d => d.y),
      currentValue: `Min ${Math.min(...icrLow.map(d => d.v)).toFixed(2)}×`,
      targetValue: "≥ 2,5×",
    });

    const tauxSuggere = Math.max(0.055, params.txInteretEmpruntLT - 0.015);
    recommandations.push({
      id: "REC_ICR_TAUX",
      priority: 2,
      issueIds: ["ICR_LOW"],
      titre: "Négocier un taux d'intérêt préférentiel",
      detail: `Le taux actuel de ${(params.txInteretEmpruntLT * 100).toFixed(1)}% est dans la fourchette haute du marché CEMAC. En présentant un dossier complet avec garanties réelles (matériel d'exploitation, contrats clients), KENENERGIE peut viser un taux de ${(tauxSuggere * 100).toFixed(1)}% (-1,5 point), ce qui réduirait la charge annuelle de ~${fmt(params.endettementLT * 0.015)}.`,
      parametre: "txInteretEmpruntLT",
      valeurActuelle: params.txInteretEmpruntLT,
      valeurSuggeree: tauxSuggere,
      deltaPct: -Math.round((params.txInteretEmpruntLT - tauxSuggere) / params.txInteretEmpruntLT * 100),
      impactAttendu: `Économie annuelle de ${fmt(params.endettementLT * (params.txInteretEmpruntLT - tauxSuggere))}, ICR +0.4× à +0.7×`,
      effort: "court terme",
      categorie: "remboursement",
      kpi: "ICR",
      gainEstime: `-${fmt(params.endettementLT * 0.015)} frais financiers`,
    });
  }

  // ── 5. FRN (Fonds de Roulement Net) ─────────────────────────────────────
  const frnByYear = YEARS.map(y => ({ y, v: banking[y].frn }));
  const frnNeg = frnByYear.filter(d => d.v < 0);

  if (frnNeg.length > 0) {
    issues.push({
      id: "FRN_NEG",
      severity: frnNeg.length >= 2 ? "critical" : "major",
      category: "liquidite",
      title: "Fonds de Roulement Net négatif",
      description: `Le FRN est négatif sur ${frnNeg.length} exercice(s), indiquant que les ressources stables ne couvrent pas les emplois stables. Le financement à court terme de l'actif immobilisé est un signal d'alarme bancaire de premier niveau.`,
      affectedYears: frnNeg.map(d => d.y),
      currentValue: `Min ${fmt(Math.min(...frnNeg.map(d => d.v)))}`,
      targetValue: "≥ 0",
    });

    recommandations.push({
      id: "REC_FRN",
      priority: 1,
      issueIds: ["FRN_NEG"],
      titre: "Réequilibrer le financement long terme / investissements",
      detail: `Le FRN négatif résulte d'investissements non entièrement couverts par les ressources permanentes. Pour KENENERGIE, cela implique : (1) différer ${fmt(Math.abs(frnNeg[0]?.v ?? 0) * 0.3)} d'investissements en Matériel d'exploitation à N+2, (2) augmenter les ressources LT de la même proportion via un complément de dette ou de capital.`,
      impactAttendu: "FRN positif dès N, amélioration du ratio d'équilibre bilan",
      effort: "immédiat",
      categorie: "liquidite",
      kpi: "FRN",
      gainEstime: "FRN → positif",
    });
  }

  // ── 6. Marge EBE / Charges ──────────────────────────────────────────────
  const margeEbeByYear = YEARS.map(y => ({ y, v: banking[y].margeEbe }));
  const margeEbeLow = margeEbeByYear.filter(d => d.v < 20);
  const avgMargeEbe = YEARS.reduce((s, y) => s + banking[y].margeEbe, 0) / YEARS.length;

  if (avgMargeEbe >= 20) score += 20;
  else if (avgMargeEbe >= 10) score += 10;

  if (margeEbeLow.length >= 2) {
    issues.push({
      id: "MARGE_EBE_LOW",
      severity: margeEbeLow.some(d => d.v < 10) ? "major" : "minor",
      category: "rentabilite",
      title: "Marge EBE insuffisante (< 20%)",
      description: `La marge EBE moyenne de ${avgMargeEbe.toFixed(1)}% est en dessous du seuil de 20% recommandé. Les charges d'exploitation (notamment services extérieurs à ${(params.tauxServicesExt * 100).toFixed(1)}% du CA) compriment excessivement la valeur ajoutée.`,
      affectedYears: margeEbeLow.map(d => d.y),
      currentValue: `Moy. ${avgMargeEbe.toFixed(1)}%`,
      targetValue: "≥ 20%",
    });

    const tauxServExtSuggere = Math.max(0.12, params.tauxServicesExt * 0.85);
    recommandations.push({
      id: "REC_CHARGES_EXT",
      priority: 2,
      issueIds: ["MARGE_EBE_LOW"],
      titre: "Réduire les charges de services extérieurs",
      detail: `Les services extérieurs représentent ${(params.tauxServicesExt * 100).toFixed(1)}% du CA — ce ratio est supérieur à la norme sectorielle (12-15% pour les entreprises d'infrastructure CEMAC). Actions : (1) Renégocier les contrats de maintenance et loyers, (2) Internaliser certaines prestations (formation, déplacements), (3) Mutualiser les assurances avec d'autres entités du groupe THE PLUG. Objectif : réduire à ${(tauxServExtSuggere * 100).toFixed(1)}%.`,
      parametre: "tauxServicesExt",
      valeurActuelle: params.tauxServicesExt,
      valeurSuggeree: tauxServExtSuggere,
      deltaPct: -15,
      impactAttendu: `Gain marge EBE de +${((params.tauxServicesExt - tauxServExtSuggere) * 100).toFixed(1)} points, soit ~${fmt((params.tauxServicesExt - tauxServExtSuggere) * resultats[YEARS[0]].ventes)} en année N`,
      effort: "court terme",
      categorie: "charges",
      kpi: "Marge EBE",
      gainEstime: `+${((params.tauxServicesExt - tauxServExtSuggere) * 100).toFixed(1)} pts marge`,
    });
  }

  // ── 7. Croissance du CA ──────────────────────────────────────────────────
  const growthByYear = YEARS.slice(1).map(y => ({ y, v: banking[y].croissanceCA }));
  const growthLow = growthByYear.filter(d => d.v < 10);

  if (growthLow.length >= 2) {
    issues.push({
      id: "GROWTH_LOW",
      severity: "minor",
      category: "croissance",
      title: "Croissance du CA insuffisante (< 10% p.a.)",
      description: `La croissance du chiffre d'affaires est inférieure à 10% sur ${growthLow.length} transition(s) d'exercice. Une croissance faible diminue la capacité à absorber les charges fixes et compromet l'amélioration naturelle du DSCR dans le temps.`,
      affectedYears: growthLow.map(d => d.y),
      currentValue: `Min ${Math.min(...growthLow.map(d => d.v)).toFixed(1)}%`,
      targetValue: "≥ 10% p.a.",
    });

    recommandations.push({
      id: "REC_GROWTH_ACTIVITE",
      priority: 3,
      issueIds: ["GROWTH_LOW"],
      titre: "Réviser les niveaux d'activité pour une montée en charge plus rapide",
      detail: `Les niveaux d'activité actuels (${params.niveauxActivite.map(v => (v * 100).toFixed(0) + "%").join(" → ")}) génèrent une progression trop lente. Pour KENENERGIE : (1) activer le pôle Innovation dès N+1 avec des contrats-cadres signés, (2) déployer le pôle Production à 70% dès N+2 via des partenariats avec les sociétés d'état camerounaises (AES-SONEL, ENEO), (3) viser une saturation à 90% dès N+3 plutôt que N+4.`,
      impactAttendu: "Croissance CA portée à 15%-25% p.a., seuil de rentabilité atteint dès N+1",
      effort: "court terme",
      categorie: "croissance",
      kpi: "Croissance CA",
      gainEstime: "+5% à +10% croissance annuelle",
    });
  }

  // ── 8. Dettes LT / CAF ──────────────────────────────────────────────────
  const dettesCafByYear = YEARS.map(y => ({ y, v: banking[y].dettesCaf }));
  const dettesCafHigh = dettesCafByYear.filter(d => d.v > 7);
  const dettesCafWarn = dettesCafByYear.filter(d => d.v > 4 && d.v <= 7);

  if (dettesCafHigh.length > 0) {
    issues.push({
      id: "DETTES_CAF_HIGH",
      severity: "major",
      category: "remboursement",
      title: "Remboursement dettes LT > 7 ans de CAF",
      description: `Il faudrait plus de 7 ans de CAF pour rembourser l'intégralité des dettes sur ${dettesCafHigh.length} exercice(s). Ce ratio signale une dépendance excessive à la dette et une capacité d'autofinancement insuffisante.`,
      affectedYears: dettesCafHigh.map(d => d.y),
      currentValue: `Max ${Math.max(...dettesCafHigh.map(d => d.v)).toFixed(2)} ans`,
      targetValue: "≤ 4 ans",
    });
  } else if (dettesCafWarn.length >= 2) {
    issues.push({
      id: "DETTES_CAF_WARN",
      severity: "minor",
      category: "remboursement",
      title: "Délai remboursement LT par CAF : zone d'alerte",
      description: `Le ratio Dettes LT / CAF se situe entre 4 et 7 ans sur ${dettesCafWarn.length} exercice(s). Acceptable mais à surveiller — toute dégradation de la CAF ferait franchir le seuil critique.`,
      affectedYears: dettesCafWarn.map(d => d.y),
      currentValue: `Moy. ${(YEARS.reduce((s, y) => s + banking[y].dettesCaf, 0) / YEARS.length).toFixed(2)} ans`,
      targetValue: "≤ 4 ans",
    });
  }

  // ── 9. Résultat net ──────────────────────────────────────────────────────
  const resNetByYear = YEARS.map(y => ({ y, v: resultats[y].beneficeNet }));
  const resNetNeg = resNetByYear.filter(d => d.v < 0);

  if (resNetNeg.length > 0) {
    issues.push({
      id: "RES_NET_NEG",
      severity: "critical",
      category: "rentabilite",
      title: "Résultat net négatif (pertes)",
      description: `Le projet est déficitaire sur ${resNetNeg.length} exercice(s). Les pertes consomment les capitaux propres et peuvent rendre le projet inéligible à tout financement bancaire.`,
      affectedYears: resNetNeg.map(d => d.y),
      currentValue: `Min ${fmt(Math.min(...resNetNeg.map(d => d.v)))}`,
      targetValue: "> 0",
    });
    recommandations.push({
      id: "REC_RES_NET",
      priority: 1,
      issueIds: ["RES_NET_NEG"],
      titre: "Rétablir la rentabilité — plan d'urgence",
      detail: `Des pertes nettes sont incompatibles avec la bancabilité du projet. Actions immédiates : (1) Réduire le taux d'imposition effectif en optimisant les déductions fiscales admises (amortissements accélérés sur matériel d'exploitation), (2) Reporter les investissements non productifs en N+1/N+2, (3) Activer des contrats commerciaux pré-signés pour sécuriser le CA en N. KENENERGIE dispose d'un avantage : la zone OHADA offre des régimes d'incitation fiscale pour les entreprises d'énergie.`,
      impactAttendu: "Résultat net positif dès N, capitaux propres préservés",
      effort: "immédiat",
      categorie: "rentabilite",
      kpi: "Résultat net",
      gainEstime: "Résultat positif",
    });
  }

  // ── 10. Seuil de rentabilité ─────────────────────────────────────────────
  const firstY = YEARS[0];
  const seuilPctN = computed.seuilRentabilite[firstY].seuilPct;
  if (seuilPctN > 70) {
    issues.push({
      id: "SEUIL_HIGH",
      severity: seuilPctN > 85 ? "critical" : "major",
      category: "rentabilite",
      title: `Seuil de rentabilité élevé en N (${seuilPctN.toFixed(1)}% du CA)`,
      description: `Le projet doit réaliser ${seuilPctN.toFixed(1)}% de son CA cible pour couvrir ses charges fixes en N. Un seuil supérieur à 70% laisse une marge de sécurité insuffisante face aux aléas opérationnels (retards de chantiers, impayés).`,
      affectedYears: [firstY],
      currentValue: `${seuilPctN.toFixed(1)}% du CA`,
      targetValue: "≤ 60%",
    });
    recommandations.push({
      id: "REC_SEUIL",
      priority: 2,
      issueIds: ["SEUIL_HIGH"],
      titre: "Réduire les charges fixes pour abaisser le seuil de rentabilité",
      detail: `Les charges fixes (personnel, amortissements, frais financiers, services ext.) représentent une part trop élevée du CA potentiel. Pour KENENERGIE : (1) Adopter une structure salariale à forte composante variable (commissions sur projets), (2) Louer plutôt qu'acheter le matériel de bureau et les véhicules légers en N, (3) Mutualiser les locaux avec d'autres activités THE PLUG IT Solutions en phase de démarrage.`,
      impactAttendu: `Seuil de rentabilité abaissé à ≤ 60%, point mort atteint dès le mois 8 de l'année N`,
      effort: "immédiat",
      categorie: "charges",
      kpi: "Seuil de rentabilité",
      gainEstime: "-10 à -15 points seuil",
    });
  }

  // ── Final score and profil ────────────────────────────────────────────────
  if (YEARS.every(y => resultats[y].beneficeNet > 0)) score += 15;
  if (YEARS.every(y => banking[y].frn >= 0)) score += 10;
  if (vanTirMetrics.irr > 0.15) score += 10;

  const profil: AnalysisResult["profil"] =
    score >= 70 ? "BANCABLE" :
    score >= 40 ? "A_CONSOLIDER" : "NON_BANCABLE";

  // ── Notes contextuelles KENENERGIE ───────────────────────────────────────
  notes.push(`KENENERGIE SARL opère dans le secteur énergie CEMAC — les ratios de rentabilité devraient s'améliorer naturellement avec la montée en charge des pôles Production et Innovation.`);
  notes.push(`Le TIR de ${(vanTirMetrics.irr * 100).toFixed(2)}% est ${vanTirMetrics.irr >= 0.20 ? "attractif — argument fort en négociation bancaire" : vanTirMetrics.irr >= 0.15 ? "acceptable" : "insuffisant pour justifier le risque — chercher à l'améliorer via réduction des investissements initiaux"}.`);
  if (params.endettementLT > 3_000_000_000) {
    notes.push(`L'endettement de ${fmt(params.endettementLT)} nécessite une banque de financement structuré (BGFI, Ecobank Corporate, ou consortium de banques BEAC). Prévoir une note de crédit et des garanties réelles couvrant au moins 80% du montant.`);
  }
  notes.push(`Atout KENENERGIE : secteur en forte demande (déficit électrique Cameroun/CEMAC estimé à 400 MW). Cet argument de marché doit figurer en tête du dossier bancaire.`);

  // Sort recommendations by priority
  recommandations.sort((a, b) => a.priority - b.priority);

  return { issues, recommandations, scoreAvant: score, notes, profil };
}
