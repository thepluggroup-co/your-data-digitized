import React, { createContext, useContext, useState, useMemo } from "react";
import {
  YEARS, ventesNormales, salaires, amortissements, totalAmortissement,
  investissements, totalInvestissement, empruntDetails as staticEmprunt,
  actionnaires, capitalConfig as staticCapitalConfig,
  apportsProgressifs, categoriesActions, gouvernance, roiParProfil,
  scenarios, companyInfo,
} from "@/lib/kenenergie-data";

// ======= Editable Parameters Type =======
export interface EditableParams {
  capitalSocial: number;
  augmentationCapital: number;
  endettementLT: number;
  comptesCourantsAssocies: number;
  txInteretEmpruntLT: number;
  tauxImpotSocietes: number;
  txDistributionBenefices: number;
  niveauxActivite: [number, number, number, number, number]; // N to N+4
  tauxAugmentationSalaires: number;
  tauxMatierePremiere: number;
  tauxAutresAchats: number;
}

const defaultParams: EditableParams = {
  capitalSocial: 10_000_000,
  augmentationCapital: 400_000_000,
  endettementLT: 5_000_000_000,
  comptesCourantsAssocies: 1_000_000_000,
  txInteretEmpruntLT: 0.08,
  tauxImpotSocietes: 0.33,
  txDistributionBenefices: 0.00,
  niveauxActivite: [0.40, 0.50, 0.63, 0.80, 1.00],
  tauxAugmentationSalaires: 0.02,
  tauxMatierePremiere: 0.55,
  tauxAutresAchats: 0.05,
};

// ======= Computed Financial Model =======
export interface ComputedModel {
  ventesParAnnee: Record<number, { infra: number; prod: number; services: number; innovation: number; total: number; txActivite: number }>;
  chargesExploitation: Record<number, { achatsMP: number; autresAchats: number; transport: number; servicesExt: number; impotsTaxes: number; autresCharges: number; chargesPersonnel: number; amortissements: number; fraisFinanciers: number; total: number }>;
  resultats: Record<number, { ventes: number; coutExploitation: number; amortissements: number; beneficeExploitation: number; interets: number; beneficeBrut: number; impots: number; beneficeNet: number; dividendes: number; reserves: number; caf: number; tir: number; resultatNetVentes: number; resultatBrutVentes: number }>;
  bilan: Record<number, { actifImmo: number; actifCirculant: number; tresorerieActif: number; totalActif: number; capitauxPropres: number; dettesFinancieres: number; passifCirculant: number; tresoreriePassif: number; totalPassif: number }>;
  planFinancement: Record<number, { caf: number; capitalSocial: number; augmentationCapital: number; empruntsLT: number; comptesCourantsAssocies: number; subventions: number; totalRessources: number; investissements: number; remboursementEmprunt: number; dividendes: number; variationBFR: number; totalEmplois: number; soldePeriode: number; tresorerieCumulee: number }>;
  empruntDetails: typeof staticEmprunt;
}

function computeModel(p: EditableParams): ComputedModel {
  const caRef = {
    infra: ventesNormales.poleInfrastructure.total,
    prod: ventesNormales.poleProduction.total,
    services: ventesNormales.poleServices.total,
    innovation: ventesNormales.poleInnovation.total,
  };
  const caRefTotal = caRef.infra + caRef.prod + caRef.services + caRef.innovation;

  // Growth factor: 1.258 compounded annually (approx from original data pattern)
  const growthRate = 0.258;

  // ---- VENTES ----
  const ventesParAnnee: ComputedModel["ventesParAnnee"] = {} as any;
  YEARS.forEach((y, i) => {
    const tx = p.niveauxActivite[i];
    const growthFactor = Math.pow(1 + growthRate / 5, i); // moderate growth
    // Use same pattern as original: base × activity × compounding
    const factor = tx * growthFactor;
    const infra = Math.round(caRef.infra * factor);
    const prod = Math.round(caRef.prod * factor);
    const services = Math.round(caRef.services * factor);
    const innovation = Math.round(caRef.innovation * factor);
    ventesParAnnee[y] = { infra, prod, services, innovation, total: infra + prod + services + innovation, txActivite: tx };
  });

  // ---- SALAIRES COMPUTATION ----
  const baseSalaireMensuel = salaires.reduce((s, x) => s + x.montant, 0);
  const commissionsVentes = baseSalaireMensuel * 0.05;
  const salaireTotalBrut = baseSalaireMensuel + commissionsVentes;
  const chargesSociales = salaireTotalBrut * 0.185;
  const chargeSalarialeMensuelle = salaireTotalBrut + chargesSociales;

  // ---- EMPRUNT COMPUTATION ----
  const montantEmprunt = p.endettementLT;
  const tauxTrimestriel = p.txInteretEmpruntLT / 4;
  const nPeriodes = 16; // 4 years of repayment (after 1 year deferral)
  const versementPeriodique = montantEmprunt > 0
    ? (montantEmprunt * tauxTrimestriel) / (1 - Math.pow(1 + tauxTrimestriel, -nPeriodes))
    : 0;

  // Build amortization schedule
  const versements: typeof staticEmprunt.versements = [];
  let solde = montantEmprunt;
  // Year 1: 4 quarters interest-only (deferral)
  for (let q = 1; q <= 4; q++) {
    const interets = Math.round(solde * tauxTrimestriel);
    versements.push({ n: q, annee: YEARS[0], soldeInitial: solde, versement: interets, principal: 0, interets, soldeFinal: solde });
  }
  // Years 2-5: 16 quarters repayment
  for (let q = 5; q <= 20; q++) {
    const interets = Math.round(solde * tauxTrimestriel);
    const principal = Math.round(versementPeriodique - interets);
    const sf = Math.max(0, solde - principal);
    const yearIdx = Math.min(4, Math.floor((q - 1) / 4));
    versements.push({ n: q, annee: YEARS[yearIdx], soldeInitial: solde, versement: Math.round(versementPeriodique), principal, interets, soldeFinal: sf });
    solde = sf;
  }

  // Aggregate interest per year
  const interetsByYear: Record<number, number> = {};
  const principalByYear: Record<number, number> = {};
  YEARS.forEach(y => { interetsByYear[y] = 0; principalByYear[y] = 0; });
  versements.forEach(v => {
    interetsByYear[v.annee] = (interetsByYear[v.annee] || 0) + v.interets;
    principalByYear[v.annee] = (principalByYear[v.annee] || 0) + v.principal;
  });

  const totalInterets = Object.values(interetsByYear).reduce((s, v) => s + v, 0);

  const empruntDetailsComputed = {
    montant: montantEmprunt,
    taux: p.txInteretEmpruntLT,
    duree: 5,
    versementPeriodique: Math.round(versementPeriodique),
    montantInterets: totalInterets,
    versements,
  };

  // ---- CHARGES ----
  const chargesExploitation: ComputedModel["chargesExploitation"] = {} as any;
  YEARS.forEach((y, i) => {
    const ca = ventesParAnnee[y].total;
    const salGrowth = Math.pow(1 + p.tauxAugmentationSalaires, i);
    const chargesPersonnel = Math.round(chargeSalarialeMensuelle * 12 * salGrowth);
    const achatsMP = Math.round(ca * p.tauxMatierePremiere * 0.0566); // ~ratio from original
    const autresAchats = Math.round(ca * p.tauxAutresAchats * 0.0291);
    const transport = Math.round(ca * 0.0173);
    const servicesExt = Math.round(ca * 0.1815);
    const impotsTaxes = Math.round(ca * 0.0069);
    const autresCharges = Math.round(ca * 0.0294);
    const amort = totalAmortissement.annees[i];
    const fraisFin = interetsByYear[y];
    const total = achatsMP + autresAchats + transport + servicesExt + impotsTaxes + autresCharges + chargesPersonnel + amort + fraisFin;
    chargesExploitation[y] = { achatsMP, autresAchats, transport, servicesExt, impotsTaxes, autresCharges, chargesPersonnel, amortissements: amort, fraisFinanciers: fraisFin, total };
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
    resultats[y] = {
      ventes: ca, coutExploitation: coutExploit, amortissements: amort,
      beneficeExploitation: benefExploit, interets, beneficeBrut: benefBrut,
      impots, beneficeNet: benefNet, dividendes, reserves: reservesCum,
      caf, tir: 34.87, resultatNetVentes: parseFloat(rnv.toFixed(2)), resultatBrutVentes: parseFloat(rbv.toFixed(2)),
    };
  });

  // ---- BILAN ----
  const bilan: ComputedModel["bilan"] = {} as any;
  let detteFin = p.endettementLT;
  let capPropres = p.capitalSocial;
  YEARS.forEach((y, i) => {
    const actifImmo = totalInvestissement.global - totalAmortissement.annees.slice(0, i + 1).reduce((s, v) => s + v, 0);
    capPropres += resultats[y].beneficeNet - resultats[y].dividendes;
    if (i === 0) capPropres += p.augmentationCapital - p.augmentationCapital; // already in capital
    detteFin -= principalByYear[y];
    const passifCirc = i === 0 ? p.comptesCourantsAssocies : Math.round(p.comptesCourantsAssocies * (1 - i * 0.01));
    const actifCirc = i === 0 ? 0 : Math.round(ventesParAnnee[y].total * 0.19);
    const totalActif = actifImmo + actifCirc + Math.max(0, resultats[y].caf * (i + 1) * 0.15);
    const tresoActif = totalActif - actifImmo - actifCirc;
    const totalPassif = totalActif;
    const tresoPassif = Math.max(0, totalPassif - capPropres - detteFin - passifCirc);
    bilan[y] = { actifImmo, actifCirculant: actifCirc, tresorerieActif: tresoActif, totalActif, capitauxPropres: capPropres, dettesFinancieres: Math.max(0, detteFin), passifCirculant: passifCirc, tresoreriePassif: tresoPassif, totalPassif };
  });

  // ---- PLAN FINANCEMENT ----
  const planFinancement: ComputedModel["planFinancement"] = {} as any;
  let tresoCum = 0;
  YEARS.forEach((y, i) => {
    const caf = resultats[y].caf;
    const capSoc = i === 0 ? p.capitalSocial : 0;
    const augCap = i === 0 ? p.augmentationCapital : 0;
    const empLT = i === 0 ? p.endettementLT : 0;
    const ccAssocies = i === 0 ? p.comptesCourantsAssocies : 0;
    const totalRes = caf + capSoc + augCap + empLT + ccAssocies;
    const invest = totalInvestissement.an[i];
    const rembEmprunt = principalByYear[y];
    const divid = resultats[y].dividendes;
    const varBFR = i === 0 ? 0 : Math.round(ventesParAnnee[y].total * 0.19 - (i > 1 ? ventesParAnnee[YEARS[i - 1]].total * 0.19 : 0));
    const totalEmpl = invest + rembEmprunt + divid + varBFR;
    const soldePeriode = totalRes - totalEmpl;
    tresoCum += soldePeriode;
    planFinancement[y] = { caf, capitalSocial: capSoc, augmentationCapital: augCap, empruntsLT: empLT, comptesCourantsAssocies: ccAssocies, subventions: 0, totalRessources: totalRes, investissements: invest, remboursementEmprunt: rembEmprunt, dividendes: divid, variationBFR: varBFR, totalEmplois: totalEmpl, soldePeriode, tresorerieCumulee: tresoCum };
  });

  return { ventesParAnnee, chargesExploitation, resultats, bilan, planFinancement, empruntDetails: empruntDetailsComputed };
}

// ======= Context =======
interface ParametresContextType {
  params: EditableParams;
  setParams: React.Dispatch<React.SetStateAction<EditableParams>>;
  updateParam: <K extends keyof EditableParams>(key: K, value: EditableParams[K]) => void;
  computed: ComputedModel;
  resetParams: () => void;
}

const ParametresContext = createContext<ParametresContextType | null>(null);

export function ParametresProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<EditableParams>(defaultParams);

  const updateParam = <K extends keyof EditableParams>(key: K, value: EditableParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const resetParams = () => setParams(defaultParams);

  const computed = useMemo(() => computeModel(params), [params]);

  return (
    <ParametresContext.Provider value={{ params, setParams, updateParam, computed, resetParams }}>
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
