import React, { createContext, useContext, useState, useMemo } from "react";
import {
  YEARS, ventesNormales, salaires as defaultSalaires, totalAmortissement,
  totalInvestissement, empruntDetails as staticEmprunt,
} from "@/lib/kenenergie-data";

// ======= Editable Salary Entry =======
export interface SalaryEntry {
  poste: string;
  qte: number;
  salaire: number;
  montant: number;
}

// ======= Editable Parameters Type =======
export interface EditableParams {
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
  tauxImpotsTaxes: number;
  tauxAutresCharges: number;
  tauxCommissionsVentes: number;
  tauxChargesSociales: number;
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
  tauxMatierePremiere: 0.0311,
  tauxAutresAchats: 0.00146,
  tauxTransport: 0.0173,
  tauxServicesExt: 0.1815,
  tauxImpotsTaxes: 0.0069,
  tauxAutresCharges: 0.0294,
  tauxCommissionsVentes: 0.05,
  tauxChargesSociales: 0.20,
};

// ======= Computed Financial Model =======
export interface ComputedModel {
  ventesParAnnee: Record<number, { infra: number; prod: number; services: number; innovation: number; total: number; txActivite: number }>;
  chargesExploitation: Record<number, { achatsMP: number; autresAchats: number; transport: number; servicesExt: number; impotsTaxes: number; autresCharges: number; chargesPersonnel: number; amortissements: number; fraisFinanciers: number; total: number }>;
  resultats: Record<number, { ventes: number; coutExploitation: number; amortissements: number; beneficeExploitation: number; interets: number; beneficeBrut: number; impots: number; beneficeNet: number; dividendes: number; reserves: number; caf: number; tir: number; resultatNetVentes: number; resultatBrutVentes: number }>;
  bilan: Record<number, { actifImmo: number; actifCirculant: number; tresorerieActif: number; totalActif: number; capitauxPropres: number; dettesFinancieres: number; passifCirculant: number; tresoreriePassif: number; totalPassif: number }>;
  planFinancement: Record<number, { caf: number; capitalSocial: number; augmentationCapital: number; empruntsLT: number; comptesCourantsAssocies: number; subventions: number; totalRessources: number; investissements: number; remboursementEmprunt: number; dividendes: number; variationBFR: number; totalEmplois: number; soldePeriode: number; tresorerieCumulee: number }>;
  empruntDetails: typeof staticEmprunt;
  seuilRentabilite: Record<number, { chargesFixes: number; chargesVariables: number; ca: number; tauxMargeCV: number; seuilCA: number; seuilPct: number; pointMortJours: number; pointMortMois: number; margeSecurite: number }>;
  salairesTotaux: { sousTotal: number; commissions: number; brut: number; chargesSociales: number; mensuel: number; annuel: number };
}

function computeModel(p: EditableParams, salairesData: SalaryEntry[]): ComputedModel {
  const caRef = {
    infra: ventesNormales.poleInfrastructure.total,
    prod: ventesNormales.poleProduction.total,
    services: ventesNormales.poleServices.total,
    innovation: ventesNormales.poleInnovation.total,
  };

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
    const achatsMP = Math.round(ca * p.tauxMatierePremiere);
    const autresAchats = Math.round(ca * p.tauxAutresAchats);
    const transport = Math.round(ca * p.tauxTransport);
    const servicesExt = Math.round(ca * p.tauxServicesExt);
    const impotsTaxes = Math.round(ca * p.tauxImpotsTaxes);
    const autresCharges = Math.round(ca * p.tauxAutresCharges);
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

  // ---- BILAN ----
  const bilan: ComputedModel["bilan"] = {} as any;
  let detteFin = p.endettementLT;
  let capPropres = p.capitalSocial;
  YEARS.forEach((y, i) => {
    const actifImmo = totalInvestissement.global - totalAmortissement.annees.slice(0, i + 1).reduce((s, v) => s + v, 0);
    capPropres += resultats[y].beneficeNet - resultats[y].dividendes;
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

  return { ventesParAnnee, chargesExploitation, resultats, bilan, planFinancement, empruntDetails: empruntDetailsComputed, seuilRentabilite, salairesTotaux };
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
}

const ParametresContext = createContext<ParametresContextType | null>(null);

export function ParametresProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<EditableParams>(defaultParams);
  const [salairesData, setSalairesData] = useState<SalaryEntry[]>(
    defaultSalaires.map(s => ({ ...s }))
  );

  const updateParam = <K extends keyof EditableParams>(key: K, value: EditableParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
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
  };

  const addSalaire = () => {
    setSalairesData(prev => [...prev, { poste: "Nouveau poste", qte: 1, salaire: 150_000, montant: 150_000 }]);
  };

  const removeSalaire = (index: number) => {
    setSalairesData(prev => prev.filter((_, i) => i !== index));
  };

  const resetParams = () => {
    setParams(defaultParams);
    setSalairesData(defaultSalaires.map(s => ({ ...s })));
  };

  const computed = useMemo(() => computeModel(params, salairesData), [params, salairesData]);

  return (
    <ParametresContext.Provider value={{ params, setParams, updateParam, computed, resetParams, salairesData, setSalairesData, updateSalaire, addSalaire, removeSalaire }}>
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
