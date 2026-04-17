import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParametres } from "@/contexts/ParametresContext";
import { YEARS, companyInfo, formatFcfa } from "@/lib/kenenergie-data";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ── Style constants ───────────────────────────────────────────────────────────
const BRAND_DARK  = "1B2A4A";  // primary dark blue
const BRAND_GOLD  = "C9A96E";  // gold accent
const WHITE       = "FFFFFF";
const LIGHT_GRAY  = "F2F4F7";
const MID_GRAY    = "E2E8F0";
const GREEN       = "16A34A";
const RED_        = "DC2626";
const AMBER       = "D97706";

function headerStyle(bgHex: string = BRAND_DARK): XLSX.CellStyle {
  return {
    fill: { fgColor: { rgb: bgHex }, patternType: "solid" } as any,
    font: { bold: true, color: { rgb: WHITE }, sz: 10, name: "Calibri" },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top:    { style: "thin", color: { rgb: MID_GRAY } },
      bottom: { style: "thin", color: { rgb: MID_GRAY } },
      left:   { style: "thin", color: { rgb: MID_GRAY } },
      right:  { style: "thin", color: { rgb: MID_GRAY } },
    },
  };
}

function dataStyle(bgHex: string = WHITE, bold = false, numFmt?: string, align: "left" | "right" | "center" = "right"): XLSX.CellStyle {
  return {
    fill: { fgColor: { rgb: bgHex }, patternType: "solid" } as any,
    font: { bold, sz: 9, name: "Calibri" },
    alignment: { horizontal: align, vertical: "center" },
    numFmt: numFmt ?? "#,##0",
    border: {
      top:    { style: "thin", color: { rgb: MID_GRAY } },
      bottom: { style: "thin", color: { rgb: MID_GRAY } },
      left:   { style: "thin", color: { rgb: MID_GRAY } },
      right:  { style: "thin", color: { rgb: MID_GRAY } },
    },
  };
}

function cell(v: unknown, style: XLSX.CellStyle): XLSX.CellObject {
  const t: XLSX.ExcelDataType =
    typeof v === "number" ? "n" :
    v instanceof Date     ? "d" : "s";
  return { v: v as any, t, s: style } as any;
}

function applyColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map(w => ({ wch: w }));
}

function setMerges(ws: XLSX.WorkSheet, merges: XLSX.Range[]) {
  ws["!merges"] = [...(ws["!merges"] ?? []), ...merges];
}

// ── Sheet builders ────────────────────────────────────────────────────────────

function buildMenuSheet(computed: ReturnType<typeof useParametres>["computed"], dossierNom: string): XLSX.WorkSheet {
  const { resultats, vanTirMetrics, banking } = computed;
  const ws: XLSX.WorkSheet = {};

  const title = (r: number, txt: string) => {
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(txt, headerStyle(BRAND_DARK));
    for (let c = 1; c <= 3; c++) ws[XLSX.utils.encode_cell({ r, c })] = cell("", headerStyle(BRAND_DARK));
  };
  const row  = (r: number, label: string, val: string) => {
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(label, dataStyle(LIGHT_GRAY, true, "@", "left"));
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(val, dataStyle(WHITE, false, "@", "left"));
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell("", dataStyle(WHITE));
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell("", dataStyle(WHITE));
  };

  title(0, "THE PLUG FINANCE CO — MENU DU DOSSIER");
  row(1, "Dossier", dossierNom);
  row(2, "Entreprise", companyInfo.name);
  row(3, "Promoteur", companyInfo.promoteur);
  row(4, "Activité", companyInfo.activite);
  row(5, "Période", `${YEARS[0]}–${YEARS[YEARS.length - 1]}`);
  row(6, "TIR Projet", (vanTirMetrics.irr * 100).toFixed(2) + "%");
  row(7, "VAN (8%)", formatFcfa(vanTirMetrics.van8, true));
  row(8, "Payback", vanTirMetrics.paybackYears.toFixed(1) + " ans");
  row(9, "CA N+4", formatFcfa(resultats[YEARS[YEARS.length - 1]].ventes, true));
  row(10, "Bénéfice cumulé", formatFcfa(YEARS.reduce((s, y) => s + resultats[y].beneficeNet, 0), true));
  row(11, "DSCR moyen (EBE)", (YEARS.reduce((s, y) => s + banking[y].dscrEbe, 0) / YEARS.length).toFixed(2) + "×");

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 11, c: 3 } });
  applyColWidths(ws, [28, 28, 15, 15]);
  setMerges(ws, [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
  ]);
  return ws;
}

function buildResultatsSheet(computed: ReturnType<typeof useParametres>["computed"]): XLSX.WorkSheet {
  const { resultats } = computed;
  const ws: XLSX.WorkSheet = {};
  const hS = headerStyle();
  const bS = (bold = false) => dataStyle(WHITE, bold);
  const altS = (bold = false) => dataStyle(LIGHT_GRAY, bold);

  const headers = ["Compte de Résultat (FCFA)", ...YEARS.map(String)];
  headers.forEach((h, c) => { ws[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, hS); });

  const rows: [string, (y: number) => number, boolean][] = [
    ["Chiffre d'affaires",         y => resultats[y].ventes,              true],
    ["Coût d'exploitation",        y => resultats[y].coutExploitation,    false],
    ["Amortissements",             y => resultats[y].amortissements,      false],
    ["Bénéfice d'exploitation",    y => resultats[y].beneficeExploitation, true],
    ["Frais financiers",           y => resultats[y].interets,             false],
    ["Bénéfice brut",              y => resultats[y].beneficeBrut,         true],
    ["Impôts sur sociétés",        y => resultats[y].impots,               false],
    ["Bénéfice net",               y => resultats[y].beneficeNet,          true],
    ["CAF",                        y => resultats[y].caf,                  true],
  ];

  rows.forEach(([label, fn, bold], ri) => {
    const r = ri + 1;
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(label, (ri % 2 === 0 ? altS : bS)(bold));
    YEARS.forEach((y, ci) => {
      ws[XLSX.utils.encode_cell({ r, c: ci + 1 })] = cell(fn(y), (ri % 2 === 0 ? altS : bS)(bold));
    });
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: YEARS.length } });
  applyColWidths(ws, [30, ...YEARS.map(() => 18)]);
  return ws;
}

function buildBilanSheet(computed: ReturnType<typeof useParametres>["computed"]): XLSX.WorkSheet {
  const { bilan } = computed;
  const ws: XLSX.WorkSheet = {};
  const hS = headerStyle();
  const bS = (bold = false) => dataStyle(WHITE, bold);
  const altS = (bold = false) => dataStyle(LIGHT_GRAY, bold);

  const headers = ["Bilan (FCFA)", ...YEARS.map(String)];
  headers.forEach((h, c) => { ws[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, hS); });

  const rows: [string, (y: number) => number, boolean][] = [
    ["ACTIF", () => 0, true],
    ["Actif immobilisé",   y => bilan[y].actifImmo,       false],
    ["Actif circulant",    y => bilan[y].actifCirculant,   false],
    ["Trésorerie actif",   y => bilan[y].tresorerieActif,  false],
    ["TOTAL ACTIF",        y => bilan[y].totalActif,       true],
    ["PASSIF", () => 0, true],
    ["Capitaux propres",   y => bilan[y].capitauxPropres,  false],
    ["Dettes financières", y => bilan[y].dettesFinancieres, false],
    ["Passif circulant",   y => bilan[y].passifCirculant,  false],
    ["Trésorerie passif",  y => bilan[y].tresoreriePassif, false],
    ["TOTAL PASSIF",       y => bilan[y].totalPassif,      true],
  ];

  rows.forEach(([label, fn, bold], ri) => {
    const r = ri + 1;
    const isSection = label === "ACTIF" || label === "PASSIF";
    const style = isSection ? headerStyle(BRAND_GOLD) : (ri % 2 === 0 ? altS : bS)(bold);
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(label, style);
    YEARS.forEach((y, ci) => {
      ws[XLSX.utils.encode_cell({ r, c: ci + 1 })] = cell(isSection ? "" : fn(y), style);
    });
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: YEARS.length } });
  applyColWidths(ws, [30, ...YEARS.map(() => 18)]);
  return ws;
}

function buildAmortSheet(computed: ReturnType<typeof useParametres>["computed"], amortData: ReturnType<typeof useParametres>["amortData"]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const hS = headerStyle();

  const headers = ["Intitulé", "Valeur totale", "Taux", ...YEARS.map(String), "Total amorti", "VNC"];
  headers.forEach((h, c) => { ws[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, hS); });

  amortData.forEach((a, ri) => {
    const r = ri + 1;
    const totalAmt = a.annees.reduce((s, v) => s + v, 0);
    const vnc = a.valeurTotale - totalAmt;
    const style = a.isSubLine ? dataStyle(LIGHT_GRAY) : dataStyle(WHITE, true);
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(a.intitule, { ...style, alignment: { horizontal: "left", vertical: "center" } } as any);
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(a.valeurTotale, style);
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(a.taux, { ...style, numFmt: "0.0%" } as any);
    a.annees.forEach((v, i) => { ws[XLSX.utils.encode_cell({ r, c: i + 3 })] = cell(v, style); });
    ws[XLSX.utils.encode_cell({ r, c: 3 + YEARS.length })] = cell(totalAmt, style);
    ws[XLSX.utils.encode_cell({ r, c: 4 + YEARS.length })] = cell(vnc, style);
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: amortData.length, c: headers.length - 1 } });
  applyColWidths(ws, [30, 16, 8, ...YEARS.map(() => 15), 15, 15]);
  return ws;
}

function buildFinancementSheet(computed: ReturnType<typeof useParametres>["computed"]): XLSX.WorkSheet {
  const { planFinancement } = computed;
  const ws: XLSX.WorkSheet = {};
  const hS = headerStyle();

  const headers = ["Plan de Financement (FCFA)", ...YEARS.map(String)];
  headers.forEach((h, c) => { ws[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, hS); });

  const rows: [string, (y: number) => number, boolean, string][] = [
    ["RESSOURCES", () => 0, true, "res"],
    ["CAF",                     y => planFinancement[y].caf,               false, ""],
    ["Capital social",          y => planFinancement[y].capitalSocial,     false, ""],
    ["Augmentation capital",    y => planFinancement[y].augmentationCapital, false, ""],
    ["Emprunts LT",             y => planFinancement[y].empruntsLT,        false, ""],
    ["Comptes courants associés", y => planFinancement[y].comptesCourantsAssocies, false, ""],
    ["Total Ressources",        y => planFinancement[y].totalRessources,   true,  "total"],
    ["EMPLOIS", () => 0, true, "emp"],
    ["Investissements",         y => planFinancement[y].investissements,   false, ""],
    ["Remboursement emprunt",   y => planFinancement[y].remboursementEmprunt, false, ""],
    ["Dividendes",              y => planFinancement[y].dividendes,        false, ""],
    ["Variation BFR",           y => planFinancement[y].variationBFR,      false, ""],
    ["Total Emplois",           y => planFinancement[y].totalEmplois,      true,  "total"],
    ["Solde période",           y => planFinancement[y].soldePeriode,      true,  "solde"],
    ["Trésorerie cumulée",      y => planFinancement[y].tresorerieCumulee, true,  "treo"],
  ];

  rows.forEach(([label, fn, bold, type], ri) => {
    const r = ri + 1;
    const isSection = type === "res" || type === "emp";
    const isTot = type === "total" || type === "solde" || type === "treo";
    const bg = isSection ? BRAND_GOLD : isTot ? "D4E9FF" : ri % 2 === 0 ? LIGHT_GRAY : WHITE;
    const style = dataStyle(bg, bold || isTot);
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(label, { ...style, alignment: { horizontal: "left", vertical: "center" } } as any);
    YEARS.forEach((y, ci) => {
      ws[XLSX.utils.encode_cell({ r, c: ci + 1 })] = cell(isSection ? "" : fn(y), style);
    });
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: YEARS.length } });
  applyColWidths(ws, [30, ...YEARS.map(() => 18)]);
  return ws;
}

function buildBankingSheet(computed: ReturnType<typeof useParametres>["computed"]): XLSX.WorkSheet {
  const { banking, vanTirMetrics } = computed;
  const ws: XLSX.WorkSheet = {};
  const hS = headerStyle();

  const headers = ["Ratios Bancaires", ...YEARS.map(String), "Norme"];
  headers.forEach((h, c) => { ws[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, hS); });

  const ratioRows: [string, (y: number) => string, (y: number) => boolean, string][] = [
    ["DSCR (EBE/Service dette)", y => banking[y].dscrEbe.toFixed(2) + "×", y => banking[y].dscrEbe >= 1.3, "≥ 1,3×"],
    ["ICR (Bénéf.expl./Intérêts)", y => (vanTirMetrics.icr[y] ?? 0).toFixed(2) + "×", y => (vanTirMetrics.icr[y] ?? 0) >= 3, "≥ 3×"],
    ["Autonomie financière", y => (banking[y].autonomie * 100).toFixed(1) + "%", y => banking[y].autonomie >= 0.25, "≥ 25%"],
    ["Marge EBE", y => banking[y].margeEbe.toFixed(1) + "%", y => banking[y].margeEbe >= 20, "≥ 20%"],
    ["Levier (Dettes/EBITDA)", y => vanTirMetrics.levier[y].toFixed(2) + "×", y => vanTirMetrics.levier[y] <= 3, "≤ 3×"],
    ["Dettes LT / CAF", y => banking[y].dettesCaf.toFixed(2) + " ans", y => banking[y].dettesCaf <= 4, "≤ 4 ans"],
    ["Liquidité générale", y => vanTirMetrics.liquidite[y].toFixed(2) + "×", y => vanTirMetrics.liquidite[y] >= 1.5, "≥ 1,5×"],
    ["ROA", y => banking[y].roa.toFixed(1) + "%", y => banking[y].roa >= 5, "≥ 5%"],
    ["Croissance CA", y => banking[y].croissanceCA.toFixed(1) + "%", y => banking[y].croissanceCA >= 10, "≥ 10%"],
  ];

  ratioRows.forEach(([label, fmt, isOk, norme], ri) => {
    const r = ri + 1;
    const rowBg = ri % 2 === 0 ? LIGHT_GRAY : WHITE;
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(label, dataStyle(rowBg, true, "@", "left"));
    YEARS.forEach((y, ci) => {
      const ok = isOk(y);
      const style: XLSX.CellStyle = {
        ...dataStyle(ok ? "DCFCE7" : "FEE2E2", true, "@", "center"),
        font: { bold: true, sz: 9, color: { rgb: ok ? GREEN : RED_ }, name: "Calibri" },
      } as any;
      ws[XLSX.utils.encode_cell({ r, c: ci + 1 })] = cell(fmt(y), style);
    });
    ws[XLSX.utils.encode_cell({ r, c: YEARS.length + 1 })] = cell(norme, dataStyle(MID_GRAY, false, "@", "center"));
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: ratioRows.length, c: YEARS.length + 1 } });
  applyColWidths(ws, [32, ...YEARS.map(() => 16), 12]);
  return ws;
}

// ── Main export function ──────────────────────────────────────────────────────
function exportDossierComplet(
  computed: ReturnType<typeof useParametres>["computed"],
  amortData: ReturnType<typeof useParametres>["amortData"],
  params: ReturnType<typeof useParametres>["params"],
  dossierNom: string,
) {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Dossier Financier THE PLUG FINANCE CO",
    Author: "THE PLUG FINANCE CO",
    Company: companyInfo.name,
    CreatedDate: new Date(),
  };

  XLSX.utils.book_append_sheet(wb, buildMenuSheet(computed, dossierNom), "MENU");
  XLSX.utils.book_append_sheet(wb, buildResultatsSheet(computed), "CEP");
  XLSX.utils.book_append_sheet(wb, buildBilanSheet(computed), "BILANS");
  XLSX.utils.book_append_sheet(wb, buildFinancementSheet(computed), "FINANCEMENT");
  XLSX.utils.book_append_sheet(wb, buildAmortSheet(computed, amortData), "AMORTISSEMENTS");
  XLSX.utils.book_append_sheet(wb, buildBankingSheet(computed), "ALERTES_BANCAIRES");

  // Synthèse rapide
  const synthWs: XLSX.WorkSheet = {};
  const hS = headerStyle();
  ["Indicateur", "Valeur", "Statut"].forEach((h, c) => { synthWs[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, hS); });
  const synthRows = [
    ["TIR Projet", (computed.vanTirMetrics.irr * 100).toFixed(2) + "%", computed.vanTirMetrics.irr >= 0.15 ? "OK" : "À revoir"],
    ["VAN (8%)", formatFcfa(computed.vanTirMetrics.van8, true), computed.vanTirMetrics.van8 > 0 ? "OK" : "Négatif"],
    ["Payback", computed.vanTirMetrics.paybackYears.toFixed(1) + " ans", computed.vanTirMetrics.paybackYears <= 5 ? "OK" : "Long"],
    ["DSCR moyen", (YEARS.reduce((s, y) => s + computed.banking[y].dscrEbe, 0) / YEARS.length).toFixed(2) + "×", "—"],
    ["Score bancabilité", "—", YEARS.every(y => computed.banking[y].dscrEbe >= 1.3 && computed.banking[y].autonomie >= 0.2) ? "BANCABLE" : "À CONSOLIDER"],
  ];
  synthRows.forEach(([ind, val, stat], ri) => {
    const r = ri + 1;
    const bg = stat === "OK" || stat === "BANCABLE" ? "DCFCE7" : stat === "À revoir" || stat === "NON BANCABLE" ? "FEE2E2" : LIGHT_GRAY;
    synthWs[XLSX.utils.encode_cell({ r, c: 0 })] = cell(ind, dataStyle(LIGHT_GRAY, true, "@", "left"));
    synthWs[XLSX.utils.encode_cell({ r, c: 1 })] = cell(val, dataStyle(WHITE, false, "@", "right"));
    synthWs[XLSX.utils.encode_cell({ r, c: 2 })] = cell(stat, dataStyle(bg, true, "@", "center"));
  });
  synthWs["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: synthRows.length, c: 2 } });
  applyColWidths(synthWs, [30, 22, 18]);
  XLSX.utils.book_append_sheet(wb, synthWs, "SYNTHESE_BANQUE");

  // Paramètres sheet
  const paramWs: XLSX.WorkSheet = {};
  const pH = headerStyle();
  ["Paramètre", "Valeur"].forEach((h, c) => { paramWs[XLSX.utils.encode_cell({ r: 0, c })] = cell(h, pH); });
  const paramRows = [
    ["Capital social", params.capitalSocial],
    ["Augmentation capital", params.augmentationCapital],
    ["Endettement LT", params.endettementLT],
    ["Comptes courants associés", params.comptesCourantsAssocies],
    ["Taux intérêt emprunt LT", (params.txInteretEmpruntLT * 100).toFixed(1) + "%"],
    ["Taux IS", (params.tauxImpotSocietes * 100).toFixed(0) + "%"],
    ["Taux matière première", (params.tauxMatierePremiere * 100).toFixed(2) + "%"],
    ["Taux services ext.", (params.tauxServicesExt * 100).toFixed(2) + "%"],
    ["Taux commissions ventes", (params.tauxCommissionsVentes * 100).toFixed(0) + "%"],
    ["Taux charges sociales", (params.tauxChargesSociales * 100).toFixed(0) + "%"],
  ];
  paramRows.forEach(([k, v], ri) => {
    const r = ri + 1;
    const bg = ri % 2 === 0 ? LIGHT_GRAY : WHITE;
    paramWs[XLSX.utils.encode_cell({ r, c: 0 })] = cell(k, dataStyle(bg, true, "@", "left"));
    paramWs[XLSX.utils.encode_cell({ r, c: 1 })] = cell(v, dataStyle(bg, false, "@", "right"));
  });
  paramWs["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: paramRows.length, c: 1 } });
  applyColWidths(paramWs, [35, 22]);
  XLSX.utils.book_append_sheet(wb, paramWs, "PARAMETRES");

  // Write and save
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const safeName = dossierNom.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 40);
  saveAs(blob, `THE_PLUG_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Button component ──────────────────────────────────────────────────────────
export default function ExportDossierComplet() {
  const { computed, amortData, params, activeDossier } = useParametres();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 100)); // let UI breathe
      exportDossierComplet(computed, amortData, params, activeDossier?.nom ?? "Dossier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Export en cours…</>
      ) : (
        <><Download className="w-3.5 h-3.5" /> Export Excel</>
      )}
    </Button>
  );
}
