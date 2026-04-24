import React, { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  YEARS, ventesNormales, salaires as defaultSalaires, totalAmortissement,
  totalInvestissement, empruntDetails as staticEmprunt, amortissements,
} from "@/lib/kenenergie-data";
import {
  listDossiers, getDossier, createDossier, saveDossier as storeSaveDossier,
  deleteDossier as storeDeleteDossier, duplicateDossier as storeDuplicateDossier,
  renameDossier as storeRenameDossier,
  exportDossierJson, importDossierJson,
  getActiveDossierId, setActiveDossierId,
  type Dossier, type DossierData,
} from "@/lib/dossier-storage";
export type { Dossier, DossierData };

// ===== Finance helpers =====
export function computeNPV(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

export function computeIRR(cashFlows: number[], guess = 0.15): number {
  let r = guess;
  for (let i = 0; i < 300; i++) {
    let npv = 0, dnpv = 0;
    cashFlows.forEach((cf, t) => {
      const d = Math.pow(1 + r, t);
      npv += cf / d;
      if (t > 0) dnpv -= (t * cf) / (d * (1 + r));
    });
    if (Math.abs(dnpv) < 1e-12) break;
    const nr = r - npv / dnpv;
    const bounded = Math.max(-0.99, Math.min(10, nr));
    if (Math.abs(bounded - r) < 1e-9) { r = bounded; break; }
    r = bounded;
  }
  return r;
}

// ======= Editable Salary Entry =======
export interface SalaryEntry {
  poste: string;
  qte: number;
  salaire: number;
  montant: number;
}

// ======= Editable Ventes Data =======
export interface VenteProduit {
  label: string;
  qte: number;
  pu: number;
  montant: number; // qte * pu — auto-computed
  unite: string;
}
export interface VentePoleData {
  label: string;
  produits: VenteProduit[];
}
export type PoleKey = "poleInfrastructure" | "poleProduction" | "poleServices" | "poleInnovation";
export type VentesData = Record<PoleKey, VentePoleData>;

// ======= Editable Investissements =======
export interface InvEntry {
  intitule: string;
  global: number;
  an: [number, number, number, number, number];
}

// ======= Editable Amortissements =======
export interface AmortEntry {
  intitule: string;
  valeurTotale: number;
  taux: number;
  annees: [number, number, number, number, number];
  isSubLine: boolean;
}

function buildDefaultVentes(): VentesData {
  return {
    poleInfrastructure: {
      label: ventesNormales.poleInfrastructure.label,
      produits: ventesNormales.poleInfrastructure.produits.map(p => ({ ...p })),
    },
    poleProduction: {
      label: ventesNormales.poleProduction.label,
      produits: ventesNormales.poleProduction.produits.map(p => ({ ...p })),
    },
    poleServices: {
      label: ventesNormales.poleServices.label,
      produits: ventesNormales.poleServices.produits.map(p => ({ ...p })),
    },
    poleInnovation: {
      label: ventesNormales.poleInnovation.label,
      produits: ventesNormales.poleInnovation.produits.map(p => ({ ...p })),
    },
  };
}

function buildDefaultAmort(): AmortEntry[] {
  return amortissements.map(a => ({
    intitule: a.intitule,
    valeurTotale: a.valeurTotale,
    taux: a.taux,
    annees: [...a.annees] as [number, number, number, number, number],
    isSubLine: a.intitule.startsWith("  "),
  }));
}

function buildDefaultInvest(): InvEntry[] {
  return [
    { intitule: "Charges immobilisées", global: 80_000_000, an: [60_000_000, 0, 16_000_000, 0, 4_000_000] },
    { intitule: "Immobilisations incorporelles", global: 50_000_000, an: [37_500_000, 0, 10_000_000, 0, 2_500_000] },
    { intitule: "Constructions et agencements", global: 716_000_000, an: [543_400_000, 0, 136_800_000, 0, 35_800_000] },
    { intitule: "Immobilisations Financières", global: 50_000_000, an: [39_583_333, 0, 7_916_667, 0, 2_500_000] },
    { intitule: "Matériel de transport", global: 825_000_000, an: [653_125_000, 0, 130_625_000, 0, 41_250_000] },
    { intitule: "Matériel et mobilier de bureau", global: 112_500_000, an: [89_062_500, 0, 17_812_500, 0, 5_625_000] },
    { intitule: "Matériel d'exploitation", global: 4_222_500_000, an: [3_342_812_500, 0, 668_562_500, 0, 211_125_000] },
    { intitule: "Autres Matériels d'exploitation", global: 52_500_000, an: [43_020_833, 0, 8_604_167, 0, 875_000] },
    { intitule: "Imprévus & Inflation (10%)", global: 610_850_000, an: [480_850_417, 0, 99_632_083, 0, 30_367_500] },
  ];
}

// ======= Editable Parameters Type =======
export interface EditableParams {
  // ── Identification de l'entreprise ──
  anneeDepart: number;
  devise: string;
  companyName: string;
  companyPromoter: string;
  companyFormeJuridique: string;
  companyVille: string;
  companyPays: string;
  companyTelephone: string;
  companyEmail: string;
  companyActivite: string;
  companyDateProjet: string;
  // ── Finances ──
  capitalSocial: number;
  augmentationCapital: number;
  endettementLT: number;
  comptesCourantsAssocies: number;
  txInteretEmpruntLT: number;
  tauxImpotSocietes: number;
  txDistributionBenefices: number;
  niveauxActivite: [number, number, number, number, number];
  tauxAugmentationSalaires: number;
  tauxMatierePremiere: number;
  tauxAutresAchats: number;
  tauxTransport: number;
  tauxServicesExt: number;
  // Détail services extérieurs (sous-taux du tauxServicesExt)
  tauxLoyer: number;
  tauxAssurances: number;
  tauxMaintenance: number;
  tauxHonoraires: number;
  tauxTelecom: number;
  tauxPublicite: number;
  tauxFormation: number;
  tauxDeplacements: number;
  tauxImpotsTaxes: number;
  tauxAutresCharges: number;
  tauxCommissionsVentes: number;
  tauxChargesSociales: number;
  // Montants fixes annuels — 0 = désactivé, utilise le taux % du CA
  fixedAchatsMP: number;
  fixedAutresAchats: number;
  fixedTransport: number;
  fixedLoyer: number;
  fixedAssurances: number;
  fixedMaintenance: number;
  fixedHonoraires: number;
  fixedTelecom: number;
  fixedPublicite: number;
  fixedFormation: number;
  fixedDeplacements: number;
  fixedImpotsTaxes: number;
  fixedAutresCharges: number;
}

const defaultParams: EditableParams = {
  anneeDepart: 2027,
  devise: "FCFA",
  companyName: "",
  companyPromoter: "",
  companyFormeJuridique: "SARL",
  companyVille: "",
  companyPays: "Cameroun",
  companyTelephone: "",
  companyEmail: "",
  companyActivite: "",
  companyDateProjet: "",
  capitalSocial: 10_000_000,
  augmentationCapital: 400_000_000,
  endettementLT: 5_000_000_000,
  comptesCourantsAssocies: 1_000_000_000,
  txInteretEmpruntLT: 0.08,
  tauxImpotSocietes: 0.33,
  txDistributionBenefices: 0.00,
  niveauxActivite: [0.40, 0.50, 0.63, 0.80, 1.00],
  tauxAugmentationSalaires: 0.02,
  tauxMatierePremiere: 0.0311,
  tauxAutresAchats: 0.00146,
  tauxTransport: 0.0173,
  tauxServicesExt: 0.1815,
  tauxLoyer: 0.045,
  tauxAssurances: 0.018,
  tauxMaintenance: 0.032,
  tauxHonoraires: 0.035,
  tauxTelecom: 0.015,
  tauxPublicite: 0.022,
  tauxFormation: 0.008,
  tauxDeplacements: 0.0065,
  tauxImpotsTaxes: 0.0069,
  tauxAutresCharges: 0.0294,
  tauxCommissionsVentes: 0.05,
  tauxChargesSociales: 0.20,
  fixedAchatsMP: 0,
  fixedAutresAchats: 0,
  fixedTransport: 0,
  fixedLoyer: 0,
  fixedAssurances: 0,
  fixedMaintenance: 0,
  fixedHonoraires: 0,
  fixedTelecom: 0,
  fixedPublicite: 0,
  fixedFormation: 0,
  fixedDeplacements: 0,
  fixedImpotsTaxes: 0,
  fixedAutresCharges: 0,
};

// ======= Computed Financial Model =======
export interface ComputedModel {
  ventesParAnnee: Record<number, { infra: number; prod: number; services: number; innovation: number; total: number; txActivite: number }>;
  chargesExploitation: Record<number, { achatsMP: number; autresAchats: number; transport: number; servicesExt: number; loyer: number; assurances: number; maintenance: number; honoraires: number; telecom: number; publicite: number; formation: number; deplacements: number; impotsTaxes: number; autresCharges: number; chargesPersonnel: number; amortissements: number; fraisFinanciers: number; total: number }>;
  resultats: Record<number, { ventes: number; coutExploitation: number; amortissements: number; beneficeExploitation: number; interets: number; beneficeBrut: number; impots: number; beneficeNet: number; dividendes: number; reserves: number; caf: number; tir: number; resultatNetVentes: number; resultatBrutVentes: number }>;
  bilan: Record<number, { actifImmo: number; actifCirculant: number; tresorerieActif: number; totalActif: number; capitauxPropres: number; dettesFinancieres: number; passifCirculant: number; tresoreriePassif: number; totalPassif: number }>;
  planFinancement: Record<number, { caf: number; capitalSocial: number; augmentationCapital: number; empruntsLT: number; comptesCourantsAssocies: number; subventions: number; totalRessources: number; investissements: number; remboursementEmprunt: number; dividendes: number; variationBFR: number; totalEmplois: number; soldePeriode: number; tresorerieCumulee: number }>;
  empruntDetails: typeof staticEmprunt;
  seuilRentabilite: Record<number, { chargesFixes: number; chargesVariables: number; ca: number; tauxMargeCV: number; seuilCA: number; seuilPct: number; pointMortJours: number; pointMortMois: number; margeSecurite: number }>;
  salairesTotaux: { sousTotal: number; commissions: number; brut: number; chargesSociales: number; mensuel: number; annuel: number };
  vanTirMetrics: {
    irr: number;
    van8: number;
    van10: number;
    van12: number;
    van15: number;
    paybackYears: number;
    cafCumul: number;
    investissementTotal: number;
    dscr: Record<number, number>;
    icr: Record<number, number>;
    levier: Record<number, number>;
    liquidite: Record<number, number>;
    equityRatio: Record<number, number>;
  };
  banking: Record<number, {
    ebe: number;
    valeurAjoutee: number;
    frn: number;
    tresoNette: number;
    serviceDette: number;
    dscrEbe: number;
    dettesCaf: number;
    cafSurDettes: number;
    croissanceCA: number;
    autonomie: number;
    dettesCp: number;
    roa: number;
    margeEbe: number;
    margeVa: number;
    ecartBilan: number;
  }>;
}

function computeModel(p: EditableParams, salairesData: SalaryEntry[], ventesData: VentesData, investData: InvEntry[], amortData: AmortEntry[]): ComputedModel {
  // ---- AMORTISSEMENTS (from editable amortData) ----
  const amortParAnnee: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  amortData.forEach(a => a.annees.forEach((v, i) => { amortParAnnee[i] += v; }));
  const amortCumul = (upToIdx: number) => amortParAnnee.slice(0, upToIdx + 1).reduce((s, v) => s + v, 0);
  // ---- VENTES BASE (from editable ventesData) ----
  const sumPole = (pole: VentePoleData) => pole.produits.reduce((s, pr) => s + pr.qte * pr.pu, 0);
  const caRef = {
    infra: sumPole(ventesData.poleInfrastructure),
    prod: sumPole(ventesData.poleProduction),
    services: sumPole(ventesData.poleServices),
    innovation: sumPole(ventesData.poleInnovation),
  };

  // ---- INVESTISSEMENTS (from editable investData) ----
  const investAnComputed: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  investData.forEach(inv => { inv.an.forEach((v, i) => { investAnComputed[i] += v; }); });
  const investGlobalComputed = investData.reduce((s, inv) => s + inv.global, 0);

  const growthRate = 0.258;

  // ---- SALAIRES ----
  const sousTotal = salairesData.reduce((s, x) => s + x.montant, 0);
  const commissions = Math.round(sousTotal * p.tauxCommissionsVentes);
  const brut = sousTotal + commissions;
  const chargesSociales = Math.round(brut * p.tauxChargesSociales);
  const chargeSalarialeMensuelle = brut + chargesSociales;
  const salairesTotaux = { sousTotal, commissions, brut, chargesSociales, mensuel: chargeSalarialeMensuelle, annuel: chargeSalarialeMensuelle * 12 };

  // ---- VENTES ----
  const ventesParAnnee: ComputedModel["ventesParAnnee"] = {} as any;
  YEARS.forEach((y, i) => {
    const tx = p.niveauxActivite[i];
    const growthFactor = Math.pow(1 + growthRate / 5, i);
    const factor = tx * growthFactor;
    const infra = Math.round(caRef.infra * factor);
    const prod = Math.round(caRef.prod * factor);
    const services = Math.round(caRef.services * factor);
    const innovation = Math.round(caRef.innovation * factor);
    ventesParAnnee[y] = { infra, prod, services, innovation, total: infra + prod + services + innovation, txActivite: tx };
  });

  // ---- EMPRUNT ----
  const montantEmprunt = p.endettementLT;
  const tauxTrimestriel = p.txInteretEmpruntLT / 4;
  const nPeriodes = 16;
  const versementPeriodique = montantEmprunt > 0
    ? (montantEmprunt * tauxTrimestriel) / (1 - Math.pow(1 + tauxTrimestriel, -nPeriodes))
    : 0;

  const versements: typeof staticEmprunt.versements = [];
  let solde = montantEmprunt;
  for (let q = 1; q <= 4; q++) {
    const interets = Math.round(solde * tauxTrimestriel);
    versements.push({ n: q, annee: YEARS[0], soldeInitial: solde, versement: interets, principal: 0, interets, soldeFinal: solde });
  }
  for (let q = 5; q <= 20; q++) {
    const interets = Math.round(solde * tauxTrimestriel);
    const principal = Math.round(versementPeriodique - interets);
    const sf = Math.max(0, solde - principal);
    const yearIdx = Math.min(4, Math.floor((q - 1) / 4));
    versements.push({ n: q, annee: YEARS[yearIdx], soldeInitial: solde, versement: Math.round(versementPeriodique), principal, interets, soldeFinal: sf });
    solde = sf;
  }

  const interetsByYear: Record<number, number> = {};
  const principalByYear: Record<number, number> = {};
  YEARS.forEach(y => { interetsByYear[y] = 0; principalByYear[y] = 0; });
  versements.forEach(v => {
    interetsByYear[v.annee] = (interetsByYear[v.annee] || 0) + v.interets;
    principalByYear[v.annee] = (principalByYear[v.annee] || 0) + v.principal;
  });

  const totalInterets = Object.values(interetsByYear).reduce((s, v) => s + v, 0);
  const empruntDetailsComputed = { montant: montantEmprunt, taux: p.txInteretEmpruntLT, duree: 5, versementPeriodique: Math.round(versementPeriodique), montantInterets: totalInterets, versements };

  // ---- CHARGES ----
  const chargesExploitation: ComputedModel["chargesExploitation"] = {} as any;
  YEARS.forEach((y, i) => {
    const ca = ventesParAnnee[y].total;
    const salGrowth = Math.pow(1 + p.tauxAugmentationSalaires, i);
    const chargesPersonnel = Math.round(chargeSalarialeMensuelle * 12 * salGrowth);
    const fix = (fixed: number, taux: number) => fixed > 0 ? fixed : Math.round(ca * taux);
    const achatsMP      = fix(p.fixedAchatsMP,    p.tauxMatierePremiere);
    const autresAchats  = fix(p.fixedAutresAchats, p.tauxAutresAchats);
    const transport     = fix(p.fixedTransport,    p.tauxTransport);
    const loyer         = fix(p.fixedLoyer,        p.tauxLoyer);
    const assurances    = fix(p.fixedAssurances,   p.tauxAssurances);
    const maintenance   = fix(p.fixedMaintenance,  p.tauxMaintenance);
    const honoraires    = fix(p.fixedHonoraires,   p.tauxHonoraires);
    const telecom       = fix(p.fixedTelecom,      p.tauxTelecom);
    const publicite     = fix(p.fixedPublicite,    p.tauxPublicite);
    const formation     = fix(p.fixedFormation,    p.tauxFormation);
    const deplacements  = fix(p.fixedDeplacements, p.tauxDeplacements);
    const servicesExt = loyer + assurances + maintenance + honoraires + telecom + publicite + formation + deplacements;
    const impotsTaxes   = fix(p.fixedImpotsTaxes,  p.tauxImpotsTaxes);
    const autresCharges = fix(p.fixedAutresCharges, p.tauxAutresCharges);
    const amort = amortParAnnee[i];
    const fraisFin = interetsByYear[y];
    const total = achatsMP + autresAchats + transport + servicesExt + impotsTaxes + autresCharges + chargesPersonnel + amort + fraisFin;
    chargesExploitation[y] = { achatsMP, autresAchats, transport, servicesExt, loyer, assurances, maintenance, honoraires, telecom, publicite, formation, deplacements, impotsTaxes, autresCharges, chargesPersonnel, amortissements: amort, fraisFinanciers: fraisFin, total };
  });

  // ---- RESULTATS ----
  const resultats: ComputedModel["resultats"] = {} as any;
  let reservesCum = 0;
  YEARS.forEach((y, i) => {
    const ca = ventesParAnnee[y].total;
    const charges = chargesExploitation[y];
    const coutExploit = charges.total - charges.amortissements - charges.fraisFinanciers;
    const amort = charges.amortissements;
    const benefExploit = ca - coutExploit - amort;
    const interets = charges.fraisFinanciers;
    const benefBrut = benefExploit - interets;
    const impots = Math.round(Math.max(0, benefBrut) * p.tauxImpotSocietes);
    const benefNet = benefBrut - impots;
    const dividendes = i === 0 ? 0 : Math.round(Math.max(0, benefNet) * p.txDistributionBenefices);
    reservesCum += benefNet - dividendes;
    const caf = benefNet + amort;
    const rnv = ca > 0 ? (benefNet / ca) * 100 : 0;
    const rbv = ca > 0 ? (benefExploit / ca) * 100 : 0;
    resultats[y] = { ventes: ca, coutExploitation: coutExploit, amortissements: amort, beneficeExploitation: benefExploit, interets, beneficeBrut: benefBrut, impots, beneficeNet: benefNet, dividendes, reserves: reservesCum, caf, tir: 34.87, resultatNetVentes: parseFloat(rnv.toFixed(2)), resultatBrutVentes: parseFloat(rbv.toFixed(2)) };
  });

  // ---- SEUIL DE RENTABILITÉ ----
  const seuilRentabilite: ComputedModel["seuilRentabilite"] = {} as any;
  YEARS.forEach((y, i) => {
    const ca = ventesParAnnee[y].total;
    const charges = chargesExploitation[y];
    // Charges fixes: personnel, amortissements, frais financiers, services ext, impôts/taxes
    const chargesFixes = charges.chargesPersonnel + charges.amortissements + charges.fraisFinanciers + charges.servicesExt + charges.impotsTaxes;
    // Charges variables: achats MP, autres achats, transport, autres charges
    const chargesVariables = charges.achatsMP + charges.autresAchats + charges.transport + charges.autresCharges;
    const tauxMargeCV = ca > 0 ? (ca - chargesVariables) / ca : 0;
    const seuilCA = tauxMargeCV > 0 ? Math.round(chargesFixes / tauxMargeCV) : 0;
    const seuilPct = ca > 0 ? (seuilCA / ca) * 100 : 0;
    const pointMortJours = Math.round(seuilPct * 360 / 100);
    const pointMortMois = parseFloat((pointMortJours / 30).toFixed(1));
    const margeSecurite = ca > 0 ? ((ca - seuilCA) / ca) * 100 : 0;
    seuilRentabilite[y] = { chargesFixes, chargesVariables, ca, tauxMargeCV, seuilCA, seuilPct: parseFloat(seuilPct.toFixed(2)), pointMortJours, pointMortMois, margeSecurite: parseFloat(margeSecurite.toFixed(2)) };
  });

  // ---- BFR — SYSCOHADA révisé 2017 ----
  // Créances clients  : CA × délai recouvrement 60 j (norme OHADA B2B énergie)
  // Stocks matières   : (achatsMP + autresAchats) × rotation 30 j
  // Dettes fournisseurs: (achatsMP + autresAchats + servicesExt) × délai paiement 45 j
  // BFR = créances + stocks − dettes fournisseurs
  const creancesParAnnee: Record<number, number> = {};
  const stocksParAnnee:   Record<number, number> = {};
  const detteFournParAnnee: Record<number, number> = {};
  const bfrParAnnee: Record<number, number> = {};
  YEARS.forEach(y => {
    const ca = ventesParAnnee[y].total;
    const c  = chargesExploitation[y];
    const creances     = Math.round(ca * 60 / 365);
    const stocks       = Math.round((c.achatsMP + c.autresAchats) * 30 / 365);
    const detteFourn   = Math.round((c.achatsMP + c.autresAchats + c.servicesExt) * 45 / 365);
    creancesParAnnee[y]  = creances;
    stocksParAnnee[y]    = stocks;
    detteFournParAnnee[y] = detteFourn;
    bfrParAnnee[y]       = creances + stocks - detteFourn;
  });

  // ---- PLAN FINANCEMENT — SYSCOHADA ----
  // varBFR = BFR[n] − BFR[n−1]  (variation réelle, non plus CA × 19%)
  // Trésorerie cumulée = somme des soldes périodiques
  const planFinancement: ComputedModel["planFinancement"] = {} as any;
  let tresoCum = 0;
  YEARS.forEach((y, i) => {
    const caf        = resultats[y].caf;
    const capSoc     = i === 0 ? p.capitalSocial        : 0;
    const augCap     = i === 0 ? p.augmentationCapital  : 0;
    const empLT      = i === 0 ? p.endettementLT        : 0;
    const ccAssocies = i === 0 ? p.comptesCourantsAssocies : 0;
    const totalRes   = caf + capSoc + augCap + empLT + ccAssocies;
    const invest     = investAnComputed[i];
    const rembEmprunt = principalByYear[y];
    const divid      = resultats[y].dividendes;
    // Variation BFR SYSCOHADA : positive = besoin supplémentaire (emploi)
    const bfrCurr    = bfrParAnnee[y];
    const bfrPrev    = i > 0 ? bfrParAnnee[YEARS[i - 1]] : 0;
    const varBFR     = bfrCurr - bfrPrev;
    // N'inclure la variation BFR dans les emplois que si elle est positive
    const varBFREmploi = Math.max(0, varBFR);
    const varBFRRes    = Math.max(0, -varBFR); // libération BFR = ressource
    const totalEmpl  = invest + rembEmprunt + divid + varBFREmploi;
    const totalResAdj = totalRes + varBFRRes;
    const soldePeriode = totalResAdj - totalEmpl;
    tresoCum += soldePeriode;
    planFinancement[y] = {
      caf, capitalSocial: capSoc, augmentationCapital: augCap,
      empruntsLT: empLT, comptesCourantsAssocies: ccAssocies,
      subventions: 0, totalRessources: totalResAdj,
      investissements: invest, remboursementEmprunt: rembEmprunt,
      dividendes: divid, variationBFR: varBFR,
      totalEmplois: totalEmpl, soldePeriode,
      tresorerieCumulee: tresoCum,
    };
  });

  // ---- BILAN — SYSCOHADA ----
  // Actif circulant  = créances clients + stocks (BFR côté actif)
  // Passif circulant = dettes fournisseurs + dettes personnel/fiscales (BFR côté passif)
  // Dettes financières = emprunt LT restant + CCA (remboursés sur 5 ans linéaires dès Y2)
  // Trésorerie actif  = solde cumulé plan financement (si positif)
  // Trésorerie passif = découvert (si négatif)
  const bilan: ComputedModel["bilan"] = {} as any;
  let detteEmprunt = p.endettementLT;
  let capPropres   = p.capitalSocial + p.augmentationCapital; // apports initiaux
  YEARS.forEach((y, i) => {
    // Actif immobilisé net
    const actifImmo = Math.max(0, investGlobalComputed - amortCumul(i));

    // Capitaux propres cumulatifs (réserves + résultat)
    capPropres += resultats[y].beneficeNet - resultats[y].dividendes;

    // Emprunt LT restant
    detteEmprunt = Math.max(0, detteEmprunt - principalByYear[y]);

    // Comptes courants associés — remboursés linéairement sur 5 ans dès année 2
    const ccFactor  = i === 0 ? 1 : Math.max(0, 1 - i / 5);
    const ccRestant = Math.round(p.comptesCourantsAssocies * ccFactor);
    const dettesFinancieres = detteEmprunt + ccRestant;

    // Actif circulant d'exploitation (BFR actif)
    const actifCirculant = creancesParAnnee[y] + stocksParAnnee[y];

    // Passif circulant (BFR passif) : dettes fourn. + dettes sociales/fiscales (~30 j)
    const c = chargesExploitation[y];
    const dettesPersonnelFisc = Math.round((c.chargesPersonnel + c.impotsTaxes) * 30 / 365);
    const passifCirculant     = detteFournParAnnee[y] + dettesPersonnelFisc;

    // Trésorerie — solde cumulé du plan de financement (équilibre du bilan)
    const treso        = planFinancement[y].tresorerieCumulee;
    const tresorerieActif  = Math.max(0, treso);
    const tresoreriePassif = Math.max(0, -treso);

    const totalActif  = actifImmo + actifCirculant + tresorerieActif;
    const totalPassif = capPropres + dettesFinancieres + passifCirculant + tresoreriePassif;

    bilan[y] = {
      actifImmo, actifCirculant, tresorerieActif, totalActif,
      capitauxPropres: capPropres, dettesFinancieres, passifCirculant,
      tresoreriePassif, totalPassif,
    };
  });

  // ---- VAN / TIR / RATIOS BANCAIRES ----
  const investTotal = investGlobalComputed;
  const cafSeries = YEARS.map(y => resultats[y].caf);
  const projectCFs = [-investTotal, ...cafSeries];
  const irr = computeIRR(projectCFs);
  const van8 = computeNPV(projectCFs, 0.08);
  const van10 = computeNPV(projectCFs, 0.10);
  const van12 = computeNPV(projectCFs, 0.12);
  const van15 = computeNPV(projectCFs, 0.15);
  let cafCumul = 0;
  let paybackYears = NaN;
  cafSeries.forEach((caf, i) => {
    cafCumul += caf;
    if (isNaN(paybackYears) && cafCumul >= investTotal) paybackYears = i + 1 + (cafCumul - investTotal) / caf * -1 + 1;
  });
  // Simplified payback: find exact crossing
  let cum = 0;
  for (let i = 0; i < cafSeries.length; i++) {
    const prev = cum;
    cum += cafSeries[i];
    if (cum >= investTotal) { paybackYears = i + (investTotal - prev) / cafSeries[i]; break; }
  }

  const dscr: Record<number, number> = {};
  const icr: Record<number, number> = {};
  const levier: Record<number, number> = {};
  const liquidite: Record<number, number> = {};
  const equityRatio: Record<number, number> = {};
  YEARS.forEach(y => {
    const r = resultats[y];
    const b = bilan[y];
    const c = chargesExploitation[y];
    const debtService = interetsByYear[y] + principalByYear[y];
    const ebitda = r.beneficeExploitation + c.amortissements;
    dscr[y] = debtService > 0 ? r.caf / debtService : 99;
    icr[y] = c.fraisFinanciers > 0 ? r.beneficeExploitation / c.fraisFinanciers : 99;
    levier[y] = ebitda > 0 ? b.dettesFinancieres / ebitda : 0;
    const liquidActif = b.actifCirculant + b.tresorerieActif;
    liquidite[y] = b.passifCirculant > 0 ? liquidActif / b.passifCirculant : 99;
    equityRatio[y] = b.totalActif > 0 ? (b.capitauxPropres / b.totalActif) * 100 : 0;
  });

  const vanTirMetrics = { irr, van8, van10, van12, van15, paybackYears, cafCumul, investissementTotal: investTotal, dscr, icr, levier, liquidite, equityRatio };

  // ---- BANKING METRICS (OHADA/SYSCOHADA) ----
  const banking: ComputedModel["banking"] = {} as any;
  YEARS.forEach((y, i) => {
    const r = resultats[y];
    const b = bilan[y];
    const c = chargesExploitation[y];
    const ca = ventesParAnnee[y].total;
    const prevCA = i > 0 ? ventesParAnnee[YEARS[i - 1]].total : ca;

    // Valeur Ajoutée SYSCOHADA : CA − consommations intermédiaires
    // (impôts & taxes et autres charges sont déduits APRÈS la VA, pas dedans)
    const valeurAjoutee = ca - (c.achatsMP + c.autresAchats + c.transport + c.servicesExt);
    // EBE SYSCOHADA : VA − charges de personnel − impôts & taxes
    const ebe = valeurAjoutee - c.chargesPersonnel - c.impotsTaxes;
    const frn = (b.capitauxPropres + b.dettesFinancieres) - b.actifImmo;
    const tresoNette = b.tresorerieActif - b.tresoreriePassif;
    const serviceDette = c.fraisFinanciers + principalByYear[y];
    const dscrEbe = serviceDette > 0 ? ebe / serviceDette : 99;
    const dettesCaf = r.caf > 0 ? b.dettesFinancieres / r.caf : 0;
    const cafSurDettes = b.dettesFinancieres > 0 ? (r.caf / b.dettesFinancieres) * 100 : 0;
    const croissanceCA = i > 0 && prevCA > 0 ? ((ca - prevCA) / prevCA) * 100 : 0;
    const autonomie = b.totalActif > 0 ? b.capitauxPropres / b.totalActif : 0;
    const dettesCp = b.capitauxPropres > 0 ? b.dettesFinancieres / b.capitauxPropres : 0;
    const roa = b.totalActif > 0 ? (r.beneficeNet / b.totalActif) * 100 : 0;
    const margeEbe = ca > 0 ? (ebe / ca) * 100 : 0;
    const margeVa = ca > 0 ? (valeurAjoutee / ca) * 100 : 0;
    const ecartBilan = Math.abs(b.totalActif - b.totalPassif);

    banking[y] = { ebe, valeurAjoutee, frn, tresoNette, serviceDette, dscrEbe, dettesCaf, cafSurDettes, croissanceCA, autonomie, dettesCp, roa, margeEbe, margeVa, ecartBilan };
  });

  return { ventesParAnnee, chargesExploitation, resultats, bilan, planFinancement, empruntDetails: empruntDetailsComputed, seuilRentabilite, salairesTotaux, vanTirMetrics, banking };
}

// ======= Context =======
interface ParametresContextType {
  params: EditableParams;
  setParams: React.Dispatch<React.SetStateAction<EditableParams>>;
  updateParam: <K extends keyof EditableParams>(key: K, value: EditableParams[K]) => void;
  computed: ComputedModel;
  resetParams: () => void;
  salairesData: SalaryEntry[];
  setSalairesData: React.Dispatch<React.SetStateAction<SalaryEntry[]>>;
  updateSalaire: (index: number, field: keyof SalaryEntry, value: number | string) => void;
  addSalaire: () => void;
  removeSalaire: (index: number) => void;
  // Ventes
  ventesData: VentesData;
  setVentesData: React.Dispatch<React.SetStateAction<VentesData>>;
  updateVenteProduit: (pole: PoleKey, idx: number, field: keyof VenteProduit, value: string | number) => void;
  addVenteProduit: (pole: PoleKey) => void;
  removeVenteProduit: (pole: PoleKey, idx: number) => void;
  updatePoleLabel: (pole: PoleKey, label: string) => void;
  resetVentes: () => void;
  // Investissements
  investData: InvEntry[];
  setInvestData: React.Dispatch<React.SetStateAction<InvEntry[]>>;
  updateInvEntry: (idx: number, field: "intitule" | "global" | number, value: string | number) => void;
  addInvEntry: () => void;
  removeInvEntry: (idx: number) => void;
  resetInvest: () => void;
  // Amortissements
  amortData: AmortEntry[];
  setAmortData: React.Dispatch<React.SetStateAction<AmortEntry[]>>;
  updateAmortEntry: (idx: number, field: "intitule" | "valeurTotale" | "taux" | number, value: string | number) => void;
  addAmortEntry: () => void;
  removeAmortEntry: (idx: number) => void;
  resetAmort: () => void;
  // Fichier importé (lié au chat IA)
  lastImportedFile: { fileName: string; fileType: string; extracted: Record<string, unknown>; importedAt: number } | null;
  setLastImportedFile: (data: { fileName: string; fileType: string; extracted: Record<string, unknown>; importedAt: number } | null) => void;
  // Dossiers
  activeDossier: Dossier | null;
  isDirty: boolean;
  allDossiers: Dossier[];
  createAndLoadDossier: (nom: string, client: string, description: string) => Dossier;
  saveCurrentDossier: () => void;
  loadDossier: (id: string) => void;
  removeDossier: (id: string) => void;
  duplicateDossier: (id: string, newNom: string) => Dossier | null;
  renameDossier: (id: string, nom: string, client?: string, description?: string) => void;
  exportDossier: (id: string) => void;
  importDossierFile: (file: File) => Promise<Dossier>;
  refreshDossiers: () => void;
}

const ParametresContext = createContext<ParametresContextType | null>(null);

function buildDossierData(p: EditableParams, sal: SalaryEntry[], ven: VentesData, inv: InvEntry[], amort: AmortEntry[]): DossierData {
  return { params: p, salairesData: sal, ventesData: ven, investData: inv, amortData: amort };
}

function applyDossierData(
  data: DossierData,
  setP: React.Dispatch<React.SetStateAction<EditableParams>>,
  setSal: React.Dispatch<React.SetStateAction<SalaryEntry[]>>,
  setVen: React.Dispatch<React.SetStateAction<VentesData>>,
  setInv: React.Dispatch<React.SetStateAction<InvEntry[]>>,
  setAmort: React.Dispatch<React.SetStateAction<AmortEntry[]>>,
) {
  setP(data.params);
  setSal(data.salairesData);
  setVen(data.ventesData);
  setInv(data.investData);
  setAmort(data.amortData);
}

export function ParametresProvider({ children }: { children: React.ReactNode }) {
  // ── Try to rehydrate from last active dossier ──
  const initial = (() => {
    const id = getActiveDossierId();
    if (id) { const d = getDossier(id); if (d) return d.data; }
    return null;
  })();

  const [params, setParams] = useState<EditableParams>(initial?.params ?? defaultParams);
  const [salairesData, setSalairesData] = useState<SalaryEntry[]>(initial?.salairesData ?? defaultSalaires.map(s => ({ ...s })));
  const [ventesData, setVentesData] = useState<VentesData>(initial?.ventesData ?? buildDefaultVentes());
  const [investData, setInvestData] = useState<InvEntry[]>(initial?.investData ?? buildDefaultInvest());
  const [amortData, setAmortData] = useState<AmortEntry[]>(initial?.amortData ?? buildDefaultAmort());
  const [lastImportedFile, setLastImportedFile] = useState<{ fileName: string; fileType: string; extracted: Record<string, unknown>; importedAt: number } | null>(null);

  // ── Dossier state ──
  const [activeDossierId, setActiveDossierIdState] = useState<string | null>(getActiveDossierId());
  const [isDirty, setIsDirty] = useState(false);
  const [dossierList, setDossierList] = useState<Dossier[]>(() => listDossiers());
  const activeDossier = dossierList.find(d => d.id === activeDossierId) ?? null;

  const refreshDossiers = useCallback(() => setDossierList(listDossiers()), []);

  // Mark dirty on any data mutation
  const markDirty = () => setIsDirty(true);

  const updateParam = <K extends keyof EditableParams>(key: K, value: EditableParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
    markDirty();
  };

  const updateSalaire = (index: number, field: keyof SalaryEntry, value: number | string) => {
    setSalairesData(prev => {
      const updated = [...prev];
      const entry = { ...updated[index] };
      if (field === "poste") entry.poste = value as string;
      else if (field === "qte") { entry.qte = value as number; entry.montant = entry.qte * entry.salaire; }
      else if (field === "salaire") { entry.salaire = value as number; entry.montant = entry.qte * entry.salaire; }
      updated[index] = entry;
      return updated;
    });
    markDirty();
  };
  const addSalaire = () => { setSalairesData(prev => [...prev, { poste: "Nouveau poste", qte: 1, salaire: 150_000, montant: 150_000 }]); markDirty(); };
  const removeSalaire = (index: number) => { setSalairesData(prev => prev.filter((_, i) => i !== index)); markDirty(); };

  // ---- Ventes ----
  const updateVenteProduit = (pole: PoleKey, idx: number, field: keyof VenteProduit, value: string | number) => {
    setVentesData(prev => {
      const poleData = { ...prev[pole] };
      const produits = poleData.produits.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [field]: value };
        if (field === "qte" || field === "pu") updated.montant = (field === "qte" ? Number(value) : p.qte) * (field === "pu" ? Number(value) : p.pu);
        return updated;
      });
      return { ...prev, [pole]: { ...poleData, produits } };
    });
    markDirty();
  };
  const addVenteProduit = (pole: PoleKey) => {
    setVentesData(prev => ({
      ...prev,
      [pole]: { ...prev[pole], produits: [...prev[pole].produits, { label: "Nouveau produit", qte: 1, pu: 1_000_000, montant: 1_000_000, unite: "unité" }] },
    }));
    markDirty();
  };
  const removeVenteProduit = (pole: PoleKey, idx: number) => {
    setVentesData(prev => ({ ...prev, [pole]: { ...prev[pole], produits: prev[pole].produits.filter((_, i) => i !== idx) } }));
    markDirty();
  };
  const updatePoleLabel = (pole: PoleKey, label: string) => {
    setVentesData(prev => ({ ...prev, [pole]: { ...prev[pole], label } }));
    markDirty();
  };
  const resetVentes = () => { setVentesData(buildDefaultVentes()); markDirty(); };

  // ---- Investissements ----
  const updateInvEntry = (idx: number, field: "intitule" | "global" | number, value: string | number) => {
    setInvestData(prev => prev.map((entry, i) => {
      if (i !== idx) return entry;
      if (field === "intitule") return { ...entry, intitule: value as string };
      if (field === "global") return { ...entry, global: Number(value) };
      const an = [...entry.an] as [number, number, number, number, number];
      an[field as number] = Number(value);
      return { ...entry, an };
    }));
    markDirty();
  };
  const addInvEntry = () => { setInvestData(prev => [...prev, { intitule: "Nouveau poste", global: 0, an: [0, 0, 0, 0, 0] }]); markDirty(); };
  const removeInvEntry = (idx: number) => { setInvestData(prev => prev.filter((_, i) => i !== idx)); markDirty(); };
  const resetInvest = () => { setInvestData(buildDefaultInvest()); markDirty(); };

  // ---- Amortissements ----
  const updateAmortEntry = (idx: number, field: "intitule" | "valeurTotale" | "taux" | number, value: string | number) => {
    setAmortData(prev => prev.map((entry, i) => {
      if (i !== idx) return entry;
      if (field === "intitule") return { ...entry, intitule: value as string };
      if (field === "valeurTotale") return { ...entry, valeurTotale: Number(value) };
      if (field === "taux") return { ...entry, taux: Number(value) };
      const annees = [...entry.annees] as [number, number, number, number, number];
      annees[field as number] = Number(value);
      return { ...entry, annees };
    }));
    markDirty();
  };
  const addAmortEntry = () => { setAmortData(prev => [...prev, { intitule: "Nouveau bien", valeurTotale: 0, taux: 0.20, annees: [0, 0, 0, 0, 0], isSubLine: false }]); markDirty(); };
  const removeAmortEntry = (idx: number) => { setAmortData(prev => prev.filter((_, i) => i !== idx)); markDirty(); };
  const resetAmort = () => { setAmortData(buildDefaultAmort()); markDirty(); };

  // ── Dossier methods ──────────────────────────────────────────────────────
  const createAndLoadDossier = useCallback((nom: string, client: string, description: string): Dossier => {
    const data = buildDossierData(params, salairesData, ventesData, investData, amortData);
    const d = createDossier(nom, client, description, data);
    setActiveDossierIdState(d.id);
    setActiveDossierId(d.id);
    setIsDirty(false);
    setDossierList(listDossiers());
    return d;
  }, [params, salairesData, ventesData, investData, amortData]);

  const saveCurrentDossier = useCallback(() => {
    const data = buildDossierData(params, salairesData, ventesData, investData, amortData);
    if (activeDossierId) {
      storeSaveDossier(activeDossierId, data);
    } else {
      const d = createDossier("Nouveau dossier", "", "", data);
      setActiveDossierIdState(d.id);
      setActiveDossierId(d.id);
    }
    setIsDirty(false);
    setDossierList(listDossiers());
  }, [activeDossierId, params, salairesData, ventesData, investData, amortData]);

  const loadDossier = useCallback((id: string) => {
    const d = getDossier(id);
    if (!d) return;
    applyDossierData(d.data, setParams, setSalairesData, setVentesData, setInvestData, setAmortData);
    setActiveDossierIdState(id);
    setActiveDossierId(id);
    setIsDirty(false);
    setDossierList(listDossiers());
  }, []);

  const removeDossier = useCallback((id: string) => {
    storeDeleteDossier(id);
    if (activeDossierId === id) {
      setActiveDossierIdState(null);
      setActiveDossierId(null);
      setParams(defaultParams);
      setSalairesData(defaultSalaires.map(s => ({ ...s })));
      setVentesData(buildDefaultVentes());
      setInvestData(buildDefaultInvest());
      setAmortData(buildDefaultAmort());
      setIsDirty(false);
    }
    setDossierList(listDossiers());
  }, [activeDossierId]);

  const duplicateDossier = useCallback((id: string, newNom: string): Dossier | null => {
    const d = storeDuplicateDossier(id, newNom);
    setDossierList(listDossiers());
    return d;
  }, []);

  const renameDossier = useCallback((id: string, nom: string, client?: string, description?: string) => {
    storeRenameDossier(id, nom, client, description);
    setDossierList(listDossiers());
  }, []);

  const exportDossier = useCallback((id: string) => {
    const d = getDossier(id);
    if (d) exportDossierJson(d);
  }, []);

  const importDossierFile = useCallback(async (file: File): Promise<Dossier> => {
    const imported = await importDossierJson(file);
    setDossierList(listDossiers());
    return imported;
  }, []);

  // Cross-tab sync: when another tab saves/deletes a dossier, refresh the list
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "theplug_dossiers") setDossierList(listDossiers());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const resetParams = () => {
    setParams(defaultParams);
    setSalairesData(defaultSalaires.map(s => ({ ...s })));
    setVentesData(buildDefaultVentes());
    setInvestData(buildDefaultInvest());
    setAmortData(buildDefaultAmort());
    markDirty();
  };

  const computed = useMemo(
    () => computeModel(params, salairesData, ventesData, investData, amortData),
    [params, salairesData, ventesData, investData, amortData]
  );

  return (
    <ParametresContext.Provider value={{
      params, setParams, updateParam, computed, resetParams,
      salairesData, setSalairesData, updateSalaire, addSalaire, removeSalaire,
      ventesData, setVentesData, updateVenteProduit, addVenteProduit, removeVenteProduit, updatePoleLabel, resetVentes,
      investData, setInvestData, updateInvEntry, addInvEntry, removeInvEntry, resetInvest,
      amortData, setAmortData, updateAmortEntry, addAmortEntry, removeAmortEntry, resetAmort,
      lastImportedFile, setLastImportedFile,
      activeDossier, isDirty, allDossiers: dossierList,
      createAndLoadDossier, saveCurrentDossier, loadDossier,
      removeDossier, duplicateDossier, renameDossier, exportDossier, importDossierFile, refreshDossiers,
    }}>
      {children}
    </ParametresContext.Provider>
  );
}

export function useParametres() {
  const ctx = useContext(ParametresContext);
  if (!ctx) throw new Error("useParametres must be used within ParametresProvider");
  return ctx;
}

export { defaultParams };
