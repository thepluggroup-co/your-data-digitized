// KENENERGIE SARL - Données du modèle financier

export const YEARS = [2027, 2028, 2029, 2030, 2031] as const;
export type Year = typeof YEARS[number];

export const companyInfo = {
  name: "KENENERGIE SARL",
  promoteur: "KENGOUM NGASSA",
  formeJuridique: "SARL",
  telephone: "237 6 90 58 54 26",
  email: "info@kenenergies.com",
  ville: "Douala",
  pays: "Cameroun",
  dateProjet: "27/02/2026",
  activite: "Construction & Aménagement d'Infrastructures Électriques BT, HTA et HTB",
};

// ======= PARAMETRES =======
export const parametres = {
  finances: {
    capitalSocial: 10_000_000,
    augmentationCapital: 400_000_000,
    endettementLT: 5_000_000_000,
    comptesCourantsAssocies: 1_000_000_000,
    txInteretStatutaire: 0.05,
    txDistributionBenefices: 0.00,
    txInteretCCAssocie: 0.00,
    txInteretEmpruntLT: 0.08,
    tauxImpotSocietes: 0.33,
  },
  niveauxActivite: {
    n: 0.40,
    n1: 0.50,
    n2: 0.63,
    n3: 0.80,
    n4: 1.00,
  },
  couts: {
    tauxSalaires: 1.00,
    tauxMatierePremiere: 0.55,
    tauxAutresAchats: 0.05,
    tauxAugmentationSalaires: 0.02,
  },
  operations: {
    duretteDetteFournisseur: 30,
    tauxAchatCashFournisseur: 0.30,
    tauxCreditFournisseur: 0.50,
    dureeDettClientPublic: 20,
    dureeDettClientPrive: 45,
    pctVentesPublics: 0.55,
    pctVentesPrives: 0.45,
    tauxCreditClientsPublics: 0.40,
    tauxVenteCashPrives: 0.60,
    dureeMoyenneEncours: 45,
    dureeMoyenneStockageMatiere: 25,
    dureeMoyenneStockagePF: 15,
  },
  variabilitéCharges: {
    achatsMatieres: 0.90,
    autresAchats: 0.80,
    soustraitance: 0.95,
    transport: 0.70,
    servicesExterieursLocation: 0.60,
    servicesExterieursAssurance: 0.30,
    impotsTaxes: 0.20,
    autresCharges: 0.40,
    chargesPersonnel: 0.40,
    fraisFinanciers: 0.20,
  },
};

// ======= VENTES =======
export const ventesNormales = {
  poleInfrastructure: {
    label: "Pôle Infrastructure",
    total: 2_624_000_000,
    produits: [
      { label: "Réseaux électriques (BT/HTA/HTB)", qte: 10, pu: 160_000_000, montant: 1_600_000_000, unite: "Km" },
      { label: "Entretien des postes", qte: 80, pu: 4_800_000, montant: 384_000_000, unite: "POSTES" },
      { label: "Bâtiments et génie civil", qte: 12_000, pu: 20_000, montant: 240_000_000, unite: "m²" },
      { label: "Installations électriques intérieures", qte: 120, pu: 2_000_000, montant: 240_000_000, unite: "lots" },
      { label: "Rénovations et maintenance", qte: 80, pu: 2_000_000, montant: 160_000_000, unite: "chantiers" },
    ]
  },
  poleProduction: {
    label: "Pôle Production Énergétiques",
    total: 2_985_000_000,
    produits: [
      { label: "Kits solaires résidentiels", qte: 3_000, pu: 315_000, montant: 945_000_000, unite: "UNITE" },
      { label: "Centrales et mini-réseaux", qte: 8, pu: 180_000_000, montant: 1_440_000_000, unite: "PROJET" },
      { label: "Systèmes hybrides", qte: 1_000, pu: 400_000, montant: 400_000_000, unite: "KWC" },
      { label: "Maintenance de centrales", qte: 8, pu: 25_000_000, montant: 200_000_000, unite: "CONTRATS" },
    ]
  },
  poleServices: {
    label: "Pôle Services",
    total: 2_029_000_000,
    produits: [
      { label: "Ventes de fournitures électriques", qte: 450, pu: 2_500_000, montant: 1_125_000_000, unite: "Tonnes" },
      { label: "Mutation des transformateurs", qte: 1_000, pu: 200_000, montant: 200_000_000, unite: "UNITE" },
      { label: "Appareillage et petit matériel", qte: 1_000, pu: 200_000, montant: 200_000_000, unite: "lots" },
      { label: "Éclairage et luminaires", qte: 1_200, pu: 120_000, montant: 144_000_000, unite: "lots" },
      { label: "Maintenance réseaux (ENEO)", qte: 12, pu: 25_000_000, montant: 300_000_000, unite: "CONTRATS" },
      { label: "Conseil et assistance technique", qte: 100, pu: 600_000, montant: 60_000_000, unite: "PROJET" },
    ]
  },
  poleInnovation: {
    label: "Pôle Innovation",
    total: 1_040_000_000,
    produits: [
      { label: "Études et ingénierie", qte: 80, pu: 8_000_000, montant: 640_000_000, unite: "PROJET" },
      { label: "Audits et diagnostics", qte: 50, pu: 1_500_000, montant: 75_000_000, unite: "PROJET" },
      { label: "Développement de solutions", qte: 8, pu: 15_000_000, montant: 120_000_000, unite: "PROJET" },
      { label: "Sécurité et protection des installations", qte: 25, pu: 5_000_000, montant: 125_000_000, unite: "PROJET" },
      { label: "Formation technique (Academy)", qte: 20, pu: 4_000_000, montant: 80_000_000, unite: "SESSIONS" },
    ]
  },
};

export const ventesParAnnee: Record<number, { infra: number; prod: number; services: number; innovation: number; total: number; txActivite: number }> = {
  2027: { infra: 1_049_600_000, prod: 1_194_000_000, services: 811_600_000, innovation: 416_000_000, total: 3_471_200_000, txActivite: 0.40 },
  2028: { infra: 1_320_396_800, prod: 1_502_052_000, services: 1_020_992_800, innovation: 523_328_000, total: 4_366_769_600, txActivite: 0.50 },
  2029: { infra: 1_661_059_174, prod: 1_889_581_416, services: 1_284_408_942, innovation: 658_346_624, total: 5_493_396_157, txActivite: 0.63 },
  2030: { infra: 2_089_612_441, prod: 2_377_093_421, services: 1_615_786_450, innovation: 828_200_053, total: 6_910_692_365, txActivite: 0.80 },
  2031: { infra: 2_628_732_451, prod: 2_990_383_524, services: 2_032_659_354, innovation: 1_041_875_667, total: 8_693_650_995, txActivite: 1.00 },
};

// ======= AMORTISSEMENTS =======
export const amortissements = [
  { intitule: "Charges immobilisées", valeurTotale: 80_000_000, taux: 0.20, annees: [12_000_000, 12_000_000, 15_200_000, 15_200_000, 15_200_000], amt: 69_600_000, vnc: 10_400_000 },
  { intitule: "  Frais d'établissement", valeurTotale: 50_000_000, taux: 0.20, annees: [7_500_000, 7_500_000, 9_500_000, 9_500_000, 9_500_000], amt: 43_500_000, vnc: 6_500_000 },
  { intitule: "  Charges à répartir", valeurTotale: 30_000_000, taux: 0.20, annees: [4_500_000, 4_500_000, 5_700_000, 5_700_000, 5_700_000], amt: 26_100_000, vnc: 3_900_000 },
  { intitule: "Immobilisations incorporelles", valeurTotale: 50_000_000, taux: 0.20, annees: [7_500_000, 7_500_000, 9_500_000, 9_500_000, 9_500_000], amt: 43_500_000, vnc: 6_500_000 },
  { intitule: "  Recherche & Développement", valeurTotale: 10_000_000, taux: 0.20, annees: [1_500_000, 1_500_000, 1_900_000, 1_900_000, 1_900_000], amt: 8_700_000, vnc: 1_300_000 },
  { intitule: "  Brevets, Licences, Logiciels", valeurTotale: 40_000_000, taux: 0.20, annees: [6_000_000, 6_000_000, 7_600_000, 7_600_000, 7_600_000], amt: 34_800_000, vnc: 5_200_000 },
  { intitule: "Constructions et agencements", valeurTotale: 716_000_000, taux: 0, annees: [19_840_000, 19_840_000, 23_040_000, 23_040_000, 24_320_000], amt: 110_080_000, vnc: 605_920_000 },
  { intitule: "  Terrain", valeurTotale: 300_000_000, taux: 0, annees: [0, 0, 0, 0, 0], amt: 0, vnc: 300_000_000 },
  { intitule: "  Constructions", valeurTotale: 320_000_000, taux: 0.05, annees: [12_000_000, 12_000_000, 15_200_000, 15_200_000, 15_200_000], amt: 69_600_000, vnc: 250_400_000 },
  { intitule: "  Installations & aménagements", valeurTotale: 96_000_000, taux: 0.10, annees: [7_840_000, 7_840_000, 7_840_000, 7_840_000, 9_120_000], amt: 40_480_000, vnc: 55_520_000 },
  { intitule: "Matériel de transport", valeurTotale: 825_000_000, taux: 0.20, annees: [130_625_000, 130_625_000, 130_625_000, 130_625_000, 130_625_000], amt: 653_125_000, vnc: 171_875_000 },
  { intitule: "  Véhicules Berline", valeurTotale: 85_000_000, taux: 0.20, annees: [13_458_333, 13_458_333, 13_458_333, 13_458_333, 13_458_333], amt: 67_291_667, vnc: 17_708_333 },
  { intitule: "  Véhicules Pick-up", valeurTotale: 115_000_000, taux: 0.20, annees: [18_208_333, 18_208_333, 18_208_333, 18_208_333, 18_208_333], amt: 91_041_667, vnc: 23_958_333 },
  { intitule: "  Fourgonnettes", valeurTotale: 135_000_000, taux: 0.20, annees: [21_375_000, 21_375_000, 21_375_000, 21_375_000, 21_375_000], amt: 106_875_000, vnc: 28_125_000 },
  { intitule: "  Camions 30T", valeurTotale: 490_000_000, taux: 0.20, annees: [77_583_333, 77_583_333, 77_583_333, 77_583_333, 77_583_333], amt: 387_916_667, vnc: 102_083_333 },
  { intitule: "Matériel et mobilier de bureau", valeurTotale: 112_500_000, taux: 0.20, annees: [17_812_500, 17_812_500, 21_058_333, 21_058_333, 21_058_333], amt: 90_883_333, vnc: 11_616_667 },
  { intitule: "  Matériel Informatique", valeurTotale: 40_000_000, taux: 0.20, annees: [6_333_333, 6_333_333, 7_600_000, 7_600_000, 7_600_000], amt: 35_466_667, vnc: 4_533_333 },
  { intitule: "  Mobilier de bureau", valeurTotale: 25_000_000, taux: 0.20, annees: [3_958_333, 3_958_333, 4_750_000, 4_750_000, 4_750_000], amt: 22_166_667, vnc: 2_833_333 },
  { intitule: "  Équipement showroom", valeurTotale: 37_500_000, taux: 0.20, annees: [5_937_500, 5_937_500, 7_125_000, 7_125_000, 7_125_000], amt: 33_250_000, vnc: 4_250_000 },
  { intitule: "Matériel d'exploitation", valeurTotale: 4_222_500_000, taux: 0.10, annees: [334_281_250, 334_281_250, 398_247_917, 398_247_917, 398_247_917], amt: 1_863_306_250, vnc: 2_359_193_750 },
  { intitule: "  Outillage électrique professionnel", valeurTotale: 40_000_000, taux: 0.10, annees: [3_166_667, 3_166_667, 3_800_000, 3_800_000, 3_800_000], amt: 17_733_333, vnc: 22_266_667 },
  { intitule: "  Matériel de chantier", valeurTotale: 4_000_000_000, taux: 0.10, annees: [316_666_667, 316_666_667, 380_000_000, 380_000_000, 380_000_000], amt: 1_773_333_333, vnc: 2_226_666_667 },
  { intitule: "  Équipements de sécurité (EPI)", valeurTotale: 150_000_000, taux: 0.10, annees: [11_875_000, 11_875_000, 11_875_000, 11_875_000, 11_875_000], amt: 59_375_000, vnc: 90_625_000 },
  { intitule: "  Groupe électrogène", valeurTotale: 12_500_000, taux: 0.10, annees: [989_583, 989_583, 989_583, 989_583, 989_583], amt: 4_947_917, vnc: 7_552_083 },
  { intitule: "  Matériel de topographie", valeurTotale: 20_000_000, taux: 0.10, annees: [1_583_333, 1_583_333, 1_583_333, 1_583_333, 1_583_333], amt: 7_916_667, vnc: 12_083_333 },
  { intitule: "Imprévus & Inflation (10%)", valeurTotale: 610_850_000, taux: 0.20, annees: [96_170_083, 96_170_083, 116_096_500, 116_096_500, 116_096_500], amt: 540_629_667, vnc: 70_220_333 },
];

export const totalAmortissement = { annees: [626_833_000, 626_833_000, 722_688_583, 722_688_583, 723_968_583], amt: 3_387_011_750, vnc: 3_322_338_250 };

// ======= CHARGES D'EXPLOITATION =======
export const chargesExploitation: Record<number, {
  achatsMP: number; autresAchats: number; transport: number;
  servicesExt: number; impotsTaxes: number; autresCharges: number;
  chargesPersonnel: number; amortissements: number; fraisFinanciers: number; total: number;
}> = {
  2027: { achatsMP: 170_000_000, autresAchats: 8_500_000, transport: 60_000_000, servicesExt: 629_721_750, impotsTaxes: 24_000_024, autresCharges: 102_000_000, chargesPersonnel: 424_736_640, amortissements: 626_833_000, fraisFinanciers: 400_000_000, total: 2_445_791_414 },
  2028: { achatsMP: 213_860_000, autresAchats: 10_693_000, transport: 75_480_000, servicesExt: 792_189_962, impotsTaxes: 30_192_030, autresCharges: 128_316_000, chargesPersonnel: 542_813_426, amortissements: 626_833_000, fraisFinanciers: 374_975_069, total: 2_795_352_487 },
  2029: { achatsMP: 269_035_880, autresAchats: 13_451_794, transport: 94_953_840, servicesExt: 996_574_972, impotsTaxes: 37_981_574, autresCharges: 161_421_528, chargesPersonnel: 683_029_184, amortissements: 722_688_583, fraisFinanciers: 308_693_576, total: 3_287_830_931 },
  2030: { achatsMP: 338_447_137, autresAchats: 16_922_357, transport: 119_451_931, servicesExt: 1_253_691_314, impotsTaxes: 47_780_820, autresCharges: 203_068_282, chargesPersonnel: 859_254_112, amortissements: 722_688_583, fraisFinanciers: 233_952_280, total: 3_795_256_816 },
  2031: { achatsMP: 425_766_498, autresAchats: 21_288_325, transport: 150_270_529, servicesExt: 1_577_143_673, impotsTaxes: 60_108_272, autresCharges: 255_459_899, chargesPersonnel: 1_080_941_741, amortissements: 723_968_583, fraisFinanciers: 153_214_509, total: 4_448_162_029 },
};

// ======= RESULTATS =======
export const resultats: Record<number, {
  ventes: number; coutExploitation: number; amortissements: number;
  beneficeExploitation: number; interets: number; beneficeBrut: number;
  impots: number; beneficeNet: number; dividendes: number; reserves: number;
  caf: number; tir: number; resultatNetVentes: number; resultatBrutVentes: number;
}> = {
  2027: { ventes: 3_471_200_000, coutExploitation: 1_418_958_414, amortissements: 626_833_000, beneficeExploitation: 1_425_408_586, interets: 400_000_000, beneficeBrut: 1_025_408_586, impots: 338_384_833, beneficeNet: 687_023_753, dividendes: 0, reserves: 687_023_753, caf: 1_313_856_753, tir: 34.87, resultatNetVentes: 19.79, resultatBrutVentes: 29.54 },
  2028: { ventes: 4_366_769_600, coutExploitation: 1_793_544_418, amortissements: 626_833_000, beneficeExploitation: 1_946_392_182, interets: 374_975_069, beneficeBrut: 1_571_417_113, impots: 518_567_647, beneficeNet: 1_052_849_466, dividendes: 500_000, reserves: 1_739_873_219, caf: 1_679_682_466, tir: 34.87, resultatNetVentes: 24.11, resultatBrutVentes: 35.99 },
  2029: { ventes: 5_493_396_157, coutExploitation: 2_256_448_772, amortissements: 722_688_583, beneficeExploitation: 2_514_258_801, interets: 308_693_576, beneficeBrut: 2_205_565_225, impots: 727_836_524, beneficeNet: 1_477_728_701, dividendes: 500_000, reserves: 3_217_601_920, caf: 2_200_417_284, tir: 34.87, resultatNetVentes: 26.90, resultatBrutVentes: 40.15 },
  2030: { ventes: 6_910_692_365, coutExploitation: 2_838_615_953, amortissements: 722_688_583, beneficeExploitation: 3_349_387_829, interets: 233_952_280, beneficeBrut: 3_115_435_549, impots: 1_028_093_731, beneficeNet: 2_087_341_818, dividendes: 500_000, reserves: 5_304_943_738, caf: 2_810_030_401, tir: 34.87, resultatNetVentes: 30.20, resultatBrutVentes: 45.08 },
  2031: { ventes: 8_693_650_995, coutExploitation: 3_570_978_937, amortissements: 723_968_583, beneficeExploitation: 4_398_703_475, interets: 153_214_509, beneficeBrut: 4_245_488_966, impots: 1_401_011_359, beneficeNet: 2_844_477_607, dividendes: 500_000, reserves: 8_149_421_345, caf: 3_568_446_191, tir: 34.87, resultatNetVentes: 32.72, resultatBrutVentes: 48.83 },
};

// ======= BILAN =======
export const bilan: Record<number, {
  actifImmo: number; actifCirculant: number; tresorerieActif: number; totalActif: number;
  capitauxPropres: number; dettesFinancieres: number; passifCirculant: number; tresoreriePassif: number; totalPassif: number;
}> = {
  2027: { actifImmo: 5_289_354_583, actifCirculant: 0, tresorerieActif: 720_645_417, totalActif: 6_010_000_000, capitauxPropres: 10_000_000, dettesFinancieres: 5_000_000_000, passifCirculant: 1_000_000_000, tresoreriePassif: 0, totalPassif: 6_010_000_000 },
  2028: { actifImmo: 4_662_521_583, actifCirculant: 814_103_437, tresorerieActif: 1_246_356_657, totalActif: 6_722_981_678, capitauxPropres: 697_023_753, dettesFinancieres: 5_000_000_000, passifCirculant: 1_025_957_925, tresoreriePassif: 0, totalPassif: 6_722_981_678 },
  2029: { actifImmo: 5_001_016_500, actifCirculant: 1_123_925_906, tresorerieActif: 2_178_301_589, totalActif: 8_303_243_995, capitauxPropres: 1_749_873_219, dettesFinancieres: 4_151_840_707, passifCirculant: 1_032_655_070, tresoreriePassif: 1_368_875_000, totalPassif: 8_303_243_995 },
  2030: { actifImmo: 4_408_952_917, actifCirculant: 1_369_495_629, tresorerieActif: 3_209_404_202, totalActif: 8_987_852_747, capitauxPropres: 3_836_715_037, dettesFinancieres: 3_233_765_811, passifCirculant: 1_041_080_078, tresoreriePassif: 876_291_822, totalPassif: 8_987_852_747 },
  2031: { actifImmo: 3_982_006_833, actifCirculant: 1_680_319_634, tresorerieActif: 3_393_652_433, totalActif: 9_055_978_901, capitauxPropres: 6_680_692_644, dettesFinancieres: 1_164_340_954, passifCirculant: 1_051_678_738, tresoreriePassif: 159_266_566, totalPassif: 9_055_978_901 },
};

// ======= TABLEAU D'EMPRUNT =======
export const empruntDetails = {
  montant: 5_000_000_000,
  taux: 0.08,
  duree: 5,
  versementPeriodique: 305_783_591,
  montantInterets: 1_453_279_680,
  versements: [
    { n: 1, annee: 2027, soldeInitial: 5_000_000_000, versement: 100_000_000, principal: 0, interets: 100_000_000, soldeFinal: 5_000_000_000 },
    { n: 2, annee: 2027, soldeInitial: 5_000_000_000, versement: 100_000_000, principal: 0, interets: 100_000_000, soldeFinal: 5_000_000_000 },
    { n: 3, annee: 2027, soldeInitial: 5_000_000_000, versement: 100_000_000, principal: 0, interets: 100_000_000, soldeFinal: 5_000_000_000 },
    { n: 4, annee: 2027, soldeInitial: 5_000_000_000, versement: 100_000_000, principal: 0, interets: 100_000_000, soldeFinal: 5_000_000_000 },
    { n: 5, annee: 2028, soldeInitial: 5_000_000_000, versement: 305_783_591, principal: 205_783_591, interets: 100_000_000, soldeFinal: 4_794_216_409 },
    { n: 6, annee: 2028, soldeInitial: 4_794_216_409, versement: 305_783_591, principal: 209_899_262, interets: 95_884_328, soldeFinal: 4_584_317_147 },
    { n: 7, annee: 2028, soldeInitial: 4_584_317_147, versement: 305_783_591, principal: 214_097_248, interets: 91_686_343, soldeFinal: 4_370_219_899 },
    { n: 8, annee: 2028, soldeInitial: 4_370_219_899, versement: 305_783_591, principal: 218_379_193, interets: 87_404_398, soldeFinal: 4_151_840_707 },
    { n: 9, annee: 2029, soldeInitial: 4_151_840_707, versement: 305_783_591, principal: 222_746_776, interets: 83_036_814, soldeFinal: 3_929_093_930 },
    { n: 10, annee: 2029, soldeInitial: 3_929_093_930, versement: 305_783_591, principal: 227_201_712, interets: 78_581_879, soldeFinal: 3_701_892_218 },
    { n: 11, annee: 2029, soldeInitial: 3_701_892_218, versement: 305_783_591, principal: 231_745_746, interets: 74_037_844, soldeFinal: 3_470_146_472 },
    { n: 12, annee: 2029, soldeInitial: 3_470_146_472, versement: 305_783_591, principal: 236_380_661, interets: 69_402_929, soldeFinal: 3_233_765_811 },
    { n: 13, annee: 2030, soldeInitial: 3_233_765_811, versement: 305_783_591, principal: 241_108_274, interets: 64_675_316, soldeFinal: 2_992_657_536 },
    { n: 14, annee: 2030, soldeInitial: 2_992_657_536, versement: 305_783_591, principal: 245_930_440, interets: 59_853_151, soldeFinal: 2_746_727_096 },
    { n: 15, annee: 2030, soldeInitial: 2_746_727_096, versement: 305_783_591, principal: 250_849_049, interets: 54_934_542, soldeFinal: 2_495_878_048 },
    { n: 16, annee: 2030, soldeInitial: 2_495_878_048, versement: 305_783_591, principal: 255_866_030, interets: 49_917_561, soldeFinal: 2_240_012_018 },
    { n: 17, annee: 2031, soldeInitial: 2_240_012_018, versement: 305_783_591, principal: 260_983_350, interets: 44_800_240, soldeFinal: 1_979_028_668 },
    { n: 18, annee: 2031, soldeInitial: 1_979_028_668, versement: 305_783_591, principal: 266_203_017, interets: 39_580_573, soldeFinal: 1_712_825_650 },
    { n: 19, annee: 2031, soldeInitial: 1_712_825_650, versement: 305_783_591, principal: 271_527_078, interets: 34_256_513, soldeFinal: 1_441_298_573 },
    { n: 20, annee: 2031, soldeInitial: 1_441_298_573, versement: 305_783_591, principal: 276_957_619, interets: 28_825_971, soldeFinal: 1_164_340_954 },
  ]
};

// ======= SALAIRES =======
export const salaires = [
  { poste: "Directeur Général", qte: 1, salaire: 1_000_000, montant: 1_000_000 },
  { poste: "Directeurs opérationnels", qte: 4, salaire: 800_000, montant: 3_200_000 },
  { poste: "Responsables de sections", qte: 20, salaire: 600_000, montant: 12_000_000 },
  { poste: "Chef de service", qte: 20, salaire: 500_000, montant: 10_000_000 },
  { poste: "Agent administratif", qte: 24, salaire: 400_000, montant: 9_600_000 },
  { poste: "Chef d'équipe", qte: 24, salaire: 300_000, montant: 7_200_000 },
  { poste: "Technicien spécialisé", qte: 50, salaire: 250_000, montant: 12_500_000 },
  { poste: "Agent Commercial", qte: 15, salaire: 200_000, montant: 3_000_000 },
  { poste: "Agent de production", qte: 32, salaire: 200_000, montant: 6_400_000 },
  { poste: "Agent de service", qte: 20, salaire: 150_000, montant: 3_000_000 },
  { poste: "Ouvrier non qualifié", qte: 15, salaire: 100_000, montant: 1_500_000 },
];

// ======= SYNTHESE SCENARIOS =======
export const scenarios = [
  {
    label: "Hypothèse Basse",
    infra: 151_938_000, prod: 185_143_500, services: 25_758_000, innovation: 22_950_000,
    txSalaire: 0.16, txCoutEquip: 0.45, txDemarrage: 0.10, txCroissance: 0.25, txSousTraitance: 0.65, tir: 0.06,
    ca: 8_680_000_000, beneficeCumul: 8_000_000_000,
    niveauOp: 85, interventionSimult: 6, effectif: 96, tauxOccupation: 0.75,
  },
  {
    label: "Hypothèse Moyenne",
    infra: 168_820_000, prod: 205_715_000, services: 28_620_000, innovation: 25_500_000,
    txSalaire: 0.18, txCoutEquip: 0.40, txDemarrage: 0.15, txCroissance: 0.75, txSousTraitance: 0.75, tir: 0.35,
    ca: 8_680_000_000, beneficeCumul: 8_150_000_000,
    niveauOp: 100, interventionSimult: 8, effectif: 96, tauxOccupation: 0.85,
  },
  {
    label: "Hypothèse Haute",
    infra: 185_702_000, prod: 226_286_500, services: 31_482_000, innovation: 28_050_000,
    txSalaire: 0.20, txCoutEquip: 0.35, txDemarrage: 0.25, txCroissance: 0.70, txSousTraitance: 0.80, tir: 0.45,
    ca: 8_680_000_000, beneficeCumul: 8_350_000_000,
    niveauOp: 115, interventionSimult: 10, effectif: 96, tauxOccupation: 0.90,
  },
];

// ======= INVESTISSEMENTS =======
export const investissements = [
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
export const totalInvestissement = { global: 6_719_350_000, an: [5_289_354_583, 0, 1_095_952_917, 0, 334_042_500] };

// ======= PLAN DE FINANCEMENT =======
export const planFinancement: Record<number, {
  // Ressources
  caf: number;
  capitalSocial: number;
  augmentationCapital: number;
  empruntsLT: number;
  comptesCourantsAssocies: number;
  subventions: number;
  totalRessources: number;
  // Emplois
  investissements: number;
  remboursementEmprunt: number;
  dividendes: number;
  variationBFR: number;
  totalEmplois: number;
  // Solde
  soldePeriode: number;
  tresorerieCumulee: number;
}> = {
  2027: {
    caf: 1_313_856_753, capitalSocial: 10_000_000, augmentationCapital: 400_000_000,
    empruntsLT: 5_000_000_000, comptesCourantsAssocies: 1_000_000_000, subventions: 0,
    totalRessources: 7_723_856_753,
    investissements: 5_289_354_583, remboursementEmprunt: 0, dividendes: 0, variationBFR: 0,
    totalEmplois: 5_289_354_583,
    soldePeriode: 2_434_502_170, tresorerieCumulee: 2_434_502_170,
  },
  2028: {
    caf: 1_679_682_466, capitalSocial: 0, augmentationCapital: 0,
    empruntsLT: 0, comptesCourantsAssocies: 0, subventions: 0,
    totalRessources: 1_679_682_466,
    investissements: 0, remboursementEmprunt: 848_159_294, dividendes: 500_000, variationBFR: 814_103_437,
    totalEmplois: 1_662_762_731,
    soldePeriode: 16_919_735, tresorerieCumulee: 2_451_421_905,
  },
  2029: {
    caf: 2_200_417_284, capitalSocial: 0, augmentationCapital: 0,
    empruntsLT: 0, comptesCourantsAssocies: 0, subventions: 0,
    totalRessources: 2_200_417_284,
    investissements: 1_095_952_917, remboursementEmprunt: 918_074_895, dividendes: 500_000, variationBFR: 309_822_469,
    totalEmplois: 2_324_350_281,
    soldePeriode: -123_932_997, tresorerieCumulee: 2_327_488_908,
  },
  2030: {
    caf: 2_810_030_401, capitalSocial: 0, augmentationCapital: 0,
    empruntsLT: 0, comptesCourantsAssocies: 0, subventions: 0,
    totalRessources: 2_810_030_401,
    investissements: 0, remboursementEmprunt: 993_753_793, dividendes: 500_000, variationBFR: 245_569_723,
    totalEmplois: 1_239_823_516,
    soldePeriode: 1_570_206_885, tresorerieCumulee: 3_897_695_793,
  },
  2031: {
    caf: 3_568_446_191, capitalSocial: 0, augmentationCapital: 0,
    empruntsLT: 0, comptesCourantsAssocies: 0, subventions: 0,
    totalRessources: 3_568_446_191,
    investissements: 334_042_500, remboursementEmprunt: 1_075_671_064, dividendes: 500_000, variationBFR: 310_824_005,
    totalEmplois: 1_721_037_569,
    soldePeriode: 1_847_408_622, tresorerieCumulee: 5_745_104_415,
  },
};

// ======= OUVERTURE DE CAPITAL & VALORISATION (Algorithme THE PLUG) =======

// Paramètres de valorisation
export const capitalConfig = {
  capitalTotal: 6_410_000_000, // Capital social 10M + Augmentation 400M + CC Associés 1000M + Emprunt 5000M
  capitalSocial: 10_000_000,
  augmentationCapital: 400_000_000,
  comptesCourantsAssocies: 1_000_000_000,
  empruntBancaireLT: 5_000_000_000,
  valeurNominaleAction: 10_000,
  get nombreActions() { return (this.capitalSocial + this.augmentationCapital) / this.valeurNominaleAction; }, // 41 000 actions
  coefficientNature: 1.5, // Coefficient de valorisation des apports en nature
  tauxDistribution: 0.00, // 0% distribution (réserves)
  investissementTotal: 6_719_350_000,
  besoinFondsRoulement: 1_370_319_634,
  get totalBesoinsDurables() { return this.investissementTotal + this.besoinFondsRoulement; },
};

// ======= TABLEAU D'ACTIONNARIAT =======
export interface Actionnaire {
  id: number;
  nom: string;
  profil: string;
  apportNumeraire: number;
  apportNature: number; // Actifs amortissables
  valeurActionsNature: number; // Nature × coeff 1.5
  nbActions: number;
  pctCapital: number;
  valeurNominaleActions: number;
  primeApport: number;
  typeActions: string;
  codeActions: string;
  droitsClauses: string;
}

export const actionnaires: Actionnaire[] = [
  {
    id: 1, nom: "Fondateur / Promoteur (KENGOUM NGASSA)", profil: "Institutionnel",
    apportNumeraire: 10_000_000, apportNature: 80_000_000, // Charges immobilisées
    valeurActionsNature: 120_000_000, nbActions: 13_000, pctCapital: 31.71,
    valeurNominaleActions: 130_000_000, primeApport: 40_000_000,
    typeActions: "Actions Fondateur (AF)", codeActions: "AF",
    droitsClauses: "Veto stratégique — incessibles 5 ans",
  },
  {
    id: 2, nom: "Directeur Général des Opérations", profil: "Technique & Management",
    apportNumeraire: 5_000_000, apportNature: 112_500_000, // Matériel & mobilier bureau
    valeurActionsNature: 168_750_000, nbActions: 17_375, pctCapital: 42.38,
    valeurNominaleActions: 173_750_000, primeApport: 56_250_000,
    typeActions: "Actions Performance (AP)", codeActions: "AP",
    droitsClauses: "Vote double — vesting 4 ans",
  },
  {
    id: 3, nom: "Directeur Technique (CTO Infrastructure)", profil: "Technique",
    apportNumeraire: 3_000_000, apportNature: 50_000_000, // Immobilisations incorporelles
    valeurActionsNature: 75_000_000, nbActions: 7_800, pctCapital: 19.02,
    valeurNominaleActions: 78_000_000, primeApport: 25_000_000,
    typeActions: "Actions Performance (AP)", codeActions: "AP",
    droitsClauses: "Vote double — vesting 4 ans",
  },
  {
    id: 4, nom: "Directeur Administratif & Financier", profil: "Financier",
    apportNumeraire: 3_000_000, apportNature: 50_000_000, // Immobilisations financières
    valeurActionsNature: 75_000_000, nbActions: 7_800, pctCapital: 19.02,
    valeurNominaleActions: 78_000_000, primeApport: 25_000_000,
    typeActions: "Actions Ordinaires B", codeActions: "B",
    droitsClauses: "Vote simple — bonus DSCR",
  },
  {
    id: 5, nom: "Directeur Commercial & Développement", profil: "Commercial",
    apportNumeraire: 2_000_000, apportNature: 0,
    valeurActionsNature: 0, nbActions: 200, pctCapital: 0.49,
    valeurNominaleActions: 2_000_000, primeApport: 0,
    typeActions: "Actions Ordinaires B", codeActions: "B",
    droitsClauses: "Vote simple — commission CA",
  },
  {
    id: 6, nom: "Investisseur Financier Tour A", profil: "Financier",
    apportNumeraire: 400_000_000, apportNature: 0,
    valeurActionsNature: 0, nbActions: 40_000, pctCapital: 97.56,
    valeurNominaleActions: 400_000_000, primeApport: 0,
    typeActions: "Actions Ordinaires A", codeActions: "A",
    droitsClauses: "Proportionnel — tag along — anti-dilution",
  },
  {
    id: 7, nom: "Banque Partenaire (BGFI / Afriland / SCB)", profil: "Créancier",
    apportNumeraire: 0, apportNature: 0,
    valeurActionsNature: 0, nbActions: 0, pctCapital: 0,
    valeurNominaleActions: 0, primeApport: 0,
    typeActions: "—", codeActions: "—",
    droitsClauses: "Créancier privilégié — DSCR covenant",
  },
  {
    id: 8, nom: "ENEO / EDC / Partenaire Institutionnel", profil: "Institutionnel",
    apportNumeraire: 0, apportNature: 0,
    valeurActionsNature: 0, nbActions: 0, pctCapital: 0,
    valeurNominaleActions: 0, primeApport: 0,
    typeActions: "Actions Privilégiées (APr)", codeActions: "APr",
    droitsClauses: "Consultatif — dividende préférentiel 5%",
  },
  {
    id: 9, nom: "BAD / SFI / Proparco (DFI)", profil: "Développement",
    apportNumeraire: 0, apportNature: 0,
    valeurActionsNature: 0, nbActions: 0, pctCapital: 0,
    valeurNominaleActions: 0, primeApport: 0,
    typeActions: "—", codeActions: "—",
    droitsClauses: "Co-financement vert — garanties partielles",
  },
  {
    id: 10, nom: "Pool Techniciens & Chefs d'Équipe", profil: "Opérationnel",
    apportNumeraire: 0, apportNature: 0,
    valeurActionsNature: 0, nbActions: 0, pctCapital: 0,
    valeurNominaleActions: 0, primeApport: 0,
    typeActions: "Actions Collaboration (ACo)", codeActions: "ACo",
    droitsClauses: "Stock-options N+2 — vesting conditionnel",
  },
];

// ======= NOMENCLATURE DES CATÉGORIES D'ACTIONS =======
export interface CategorieActions {
  code: string;
  nom: string;
  titulaires: string;
  vote: string;
  dividende: string;
  liquidation: string;
  cession: string;
  condition: string;
}

export const categoriesActions: CategorieActions[] = [
  { code: "AF", nom: "Actions Fondateur", titulaires: "Fondateur/Promoteur", vote: "Veto", dividende: "Normal", liquidation: "Rang 1", cession: "Incessibles 5 ans", condition: "Contrôle décisions stratégiques" },
  { code: "AP", nom: "Actions Performance", titulaires: "DG, CTO", vote: "Double (2×)", dividende: "Normal+bonus", liquidation: "Rang 2", cession: "Vesting 4 ans", condition: "Conditionnées présence & objectifs" },
  { code: "A", nom: "Ordinaires A", titulaires: "Investisseur Tour A", vote: "Proportionnel", dividende: "Prioritaire", liquidation: "Rang 3", cession: "Tag Along", condition: "TRI min 25% garanti — anti-dilution" },
  { code: "B", nom: "Ordinaires B", titulaires: "DAF, Dir. Commercial", vote: "Simple", dividende: "Normal", liquidation: "Rang 4", cession: "Libre", condition: "Bonus DSCR > 1,5×" },
  { code: "APr", nom: "Privilégiées", titulaires: "Institutionnel", vote: "Consultatif", dividende: "5% garanti", liquidation: "Rang 5", cession: "Rachat N+5", condition: "Dividende préférentiel — pas de vote" },
  { code: "ACo", nom: "Collaboration", titulaires: "Techniciens, Pool", vote: "Consultatif", dividende: "Normal", liquidation: "Rang 6", cession: "Stock-opt N+2", condition: "Conditionnées 65% activité N+2" },
];

// ======= APPORTS PROGRESSIFS (proportionnels aux taux d'activité) =======
export interface ApportProgressif {
  acteur: string;
  nature: string;
  apportN: number;   // 40%
  apportN2: number;  // 63%
  apportN4: number;  // 100%
  categorie: "interne" | "externe" | "strategique";
}

export const apportsProgressifs: ApportProgressif[] = [
  // Internes
  { acteur: "FONDATEUR / PROMOTEUR", nature: "Capital + CC + réseau institutionnel", apportN: 52_000_000, apportN2: 84_500_000, apportN4: 130_000_000, categorie: "interne" },
  { acteur: "DIRECTEUR GÉNÉRAL", nature: "Management opérationnel + actifs mobiliers", apportN: 69_500_000, apportN2: 112_937_500, apportN4: 173_750_000, categorie: "interne" },
  { acteur: "CTO INFRASTRUCTURE", nature: "Actifs incorporels (R&D, brevets, logiciels)", apportN: 31_200_000, apportN2: 50_700_000, apportN4: 78_000_000, categorie: "interne" },
  { acteur: "DAF", nature: "Ingénierie financière, accès crédit bancaire", apportN: 31_200_000, apportN2: 50_700_000, apportN4: 78_000_000, categorie: "interne" },
  { acteur: "DIR. COMMERCIAL", nature: "Portefeuille clients, contrats cadres", apportN: 800_000, apportN2: 1_300_000, apportN4: 2_000_000, categorie: "interne" },
  // Externes
  { acteur: "INVESTISSEUR TOUR A", nature: "Augmentation capital (cash) + garanties", apportN: 160_000_000, apportN2: 300_000_000, apportN4: 400_000_000, categorie: "externe" },
  { acteur: "BANQUE PARTENAIRE", nature: "Crédit LT 5 Mds FCFA / 8% — différé 12 mois", apportN: 5_000_000_000, apportN2: 4_151_840_707, apportN4: 1_164_340_954, categorie: "externe" },
  { acteur: "ENEO / EDC / ARSEL", nature: "Contrats cadres maintenance & infrastructure", apportN: 0, apportN2: 0, apportN4: 0, categorie: "externe" },
  // Stratégiques
  { acteur: "BAD / SFI / PROPARCO", nature: "Co-financement vert centrales solaires", apportN: 0, apportN2: 0, apportN4: 0, categorie: "strategique" },
  { acteur: "POOL TECHNICIENS (225)", nature: "Expertise métier + exécution chantiers", apportN: 0, apportN2: 0, apportN4: 0, categorie: "strategique" },
  { acteur: "COLLECTIVITÉS / MAIRIES", nature: "Commandes électrification + partenariats locaux", apportN: 0, apportN2: 0, apportN4: 0, categorie: "strategique" },
];

// ======= GOUVERNANCE =======
export interface OrganeGouvernance {
  organe: string;
  composition: string;
  frequence: string;
  attributions: string;
}

export const gouvernance: OrganeGouvernance[] = [
  { organe: "ASSEMBLÉE GÉNÉRALE", composition: "Tous les actionnaires", frequence: "1×/an + convocation extraordinaire si > 25% du capital", attributions: "Approbation comptes annuels, distribution dividendes, augmentation de capital, modifications statutaires" },
  { organe: "CONSEIL D'ADMINISTRATION", composition: "Fondateur (Pdt), Investisseur (1 siège), Institutionnel (observateur) — 3 membres + 1 observateur", frequence: "Trimestrielle", attributions: "Validation stratégie, approbation budgets > 500 M FCFA, recrutement DG, relations bancaires" },
  { organe: "COMITÉ DE DIRECTION (CODIR)", composition: "DG, CTO, DAF, Dir. Commercial, 4 Dir. Opérationnels", frequence: "Mensuelle", attributions: "Pilotage opérationnel, suivi KPIs, alertes bancaires DSCR, reporting SYSCOHADA" },
  { organe: "COMITÉ D'AUDIT & RISQUES", composition: "DAF (Président), Investisseur (1 membre), Expert externe", frequence: "Semestrielle", attributions: "Contrôle interne, conformité OHADA, validation dossiers bancaires et états financiers" },
  { organe: "COMITÉ TECHNIQUE", composition: "CTO, 4 Responsables de pôles, Chefs d'équipe terrain", frequence: "Trimestrielle", attributions: "Validation plans de chantier, normes sécurité, gestion du matériel d'exploitation" },
];

// ======= ROI PAR PROFIL =======
export interface ProfilROI {
  acteur: string;
  apportTotal: number;
  dividendesCumules: number;
  plusValueEstimee: number;
  retourTotal: number;
  roiPct: number;
  delaiRetour: string;
}

export const roiParProfil: ProfilROI[] = [
  { acteur: "Fondateur / Promoteur", apportTotal: 130_000_000, dividendesCumules: 0, plusValueEstimee: 2_585_000_000, retourTotal: 2_585_000_000, roiPct: 1988.5, delaiRetour: "< 3 ans" },
  { acteur: "Investisseur Tour A", apportTotal: 400_000_000, dividendesCumules: 0, plusValueEstimee: 7_950_000_000, retourTotal: 7_950_000_000, roiPct: 1987.5, delaiRetour: "< 3 ans" },
  { acteur: "DG Opérationnel", apportTotal: 173_750_000, dividendesCumules: 0, plusValueEstimee: 3_452_000_000, retourTotal: 3_452_000_000, roiPct: 1987.1, delaiRetour: "< 3 ans" },
  { acteur: "CTO Infrastructure", apportTotal: 78_000_000, dividendesCumules: 0, plusValueEstimee: 1_550_000_000, retourTotal: 1_550_000_000, roiPct: 1987.2, delaiRetour: "< 4 ans" },
  { acteur: "DAF", apportTotal: 78_000_000, dividendesCumules: 0, plusValueEstimee: 1_550_000_000, retourTotal: 1_550_000_000, roiPct: 1987.2, delaiRetour: "< 4 ans" },
  { acteur: "Banque Partenaire", apportTotal: 5_000_000_000, dividendesCumules: 1_453_279_680, plusValueEstimee: 0, retourTotal: 1_453_279_680, roiPct: 29.1, delaiRetour: "5 ans (intérêts)" },
];

export const besoinsDurables = {
  investissementTotal: 6_719_350_000,
  besoinFondsRoulement: 1_370_319_634,
  get totalBesoinsDurables() { return this.investissementTotal + this.besoinFondsRoulement; },
};

export const structureFinancement = {
  capitalSocial: { montant: 10_000_000, pctTotal: 0.12 },
  augmentationCapital: { montant: 400_000_000, pctTotal: 4.95 },
  comptesCourantsAssocies: { montant: 1_000_000_000, pctTotal: 12.36 },
  empruntBancaire: { montant: 5_000_000_000, pctTotal: 61.81 },
  autofinancement: { montant: 1_679_669_634, pctTotal: 20.76 },
  totalRessourcesDurables: 8_089_669_634,
  ratioEndettement: 0.62,
  ratioFondsPropres: 0.17,
};

// ======= UTILS =======
export function formatFcfa(val: number, compact = false): string {
  if (compact) {
    if (Math.abs(val) >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + " Mds";
    if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + " M";
    return val.toLocaleString("fr-FR");
  }
  if (val === 0) return "-";
  return val.toLocaleString("fr-FR") + " FCFA";
}

export function formatPct(val: number): string {
  return (val * 100).toFixed(1) + "%";
}

export function formatNumber(val: number): string {
  if (val === 0) return "-";
  return val.toLocaleString("fr-FR");
}
