import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useParametres } from "@/contexts/ParametresContext";
import { YEARS, formatFcfa } from "@/lib/kenenergie-data";

export default function ExportPdfButton() {
  const [loading, setLoading] = useState(false);
  const { computed, salairesData, params } = useParametres();

  const handleExport = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const addHeader = (title: string) => {
        doc.setFillColor(27, 42, 71);
        doc.rect(0, 0, pageW, 18, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("KENENERGIE SARL — Business Plan 2027-2031", 10, 11);
        doc.setFontSize(9);
        doc.text(title, pageW - 10, 11, { align: "right" });
        doc.setTextColor(0, 0, 0);
      };

      const addFooter = (page: number) => {
        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.text(`Page ${page}`, pageW - 10, pageH - 5, { align: "right" });
        doc.text("Document généré automatiquement — Modèle Financier KENENERGIE", 10, pageH - 5);
        doc.setTextColor(0);
      };

      let pageNum = 1;

      // ===== PAGE 1: Paramètres =====
      addHeader("Paramètres du Modèle");
      const paramRows = [
        ["Capital Social", formatFcfa(params.capitalSocial)],
        ["Augmentation de Capital", formatFcfa(params.augmentationCapital)],
        ["Endettement LT", formatFcfa(params.endettementLT)],
        ["Taux d'intérêt", (params.txInteretEmpruntLT * 100).toFixed(1) + "%"],
        ["Taux IS", (params.tauxImpotSocietes * 100).toFixed(0) + "%"],
        ["Niveaux d'activité", params.niveauxActivite.map(n => (n * 100).toFixed(0) + "%").join(" → ")],
      ];
      autoTable(doc, {
        startY: 24,
        head: [["Paramètre", "Valeur"]],
        body: paramRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 2: Salaires =====
      doc.addPage();
      addHeader("Masse Salariale");
      const salRows = salairesData.map(s => [s.poste, s.qte.toString(), formatFcfa(s.salaire), formatFcfa(s.montant)]);
      salRows.push(["TOTAL", salairesData.reduce((s, r) => s + r.qte, 0).toString(), "", formatFcfa(computed.salairesTotaux.sousTotal)]);
      salRows.push(["Masse salariale annuelle", "", "", formatFcfa(computed.salairesTotaux.annuel)]);
      autoTable(doc, {
        startY: 24,
        head: [["Poste", "Qté", "Salaire", "Montant"]],
        body: salRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 3: Ventes =====
      doc.addPage();
      addHeader("Prévision des Ventes");
      const ventesRows = YEARS.map(y => {
        const v = computed.ventesParAnnee[y];
        return [y.toString(), formatFcfa(v.infra), formatFcfa(v.prod), formatFcfa(v.services), formatFcfa(v.innovation), formatFcfa(v.total)];
      });
      autoTable(doc, {
        startY: 24,
        head: [["Année", "Infrastructure", "Production", "Services", "Innovation", "TOTAL"]],
        body: ventesRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 4: Charges =====
      doc.addPage();
      addHeader("Charges d'Exploitation");
      const chargeKeys = ["achatsMP", "autresAchats", "transport", "servicesExt", "impotsTaxes", "autresCharges", "chargesPersonnel", "amortissements", "fraisFinanciers", "total"];
      const chargeLabels2 = ["Achats MP", "Autres Achats", "Transport", "Services Ext.", "Impôts/Taxes", "Autres", "Personnel", "Amort.", "Frais Fin.", "TOTAL"];
      const chargeRows = chargeKeys.map((k, idx) =>
        [chargeLabels2[idx], ...YEARS.map(y => formatFcfa((computed.chargesExploitation[y] as any)[k]))]
      );
      autoTable(doc, {
        startY: 24,
        head: [["Charge", ...YEARS.map(String)]],
        body: chargeRows,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 5: Résultats =====
      doc.addPage();
      addHeader("Compte de Résultats");
      const resKeys: [string, string][] = [
        ["ventes", "Chiffre d'Affaires"], ["coutExploitation", "Coût d'Exploitation"], ["amortissements", "Amortissements"],
        ["beneficeExploitation", "Bénéfice d'Exploitation"], ["interets", "Frais Financiers"], ["beneficeBrut", "Bénéfice Brut"],
        ["impots", "Impôts (IS)"], ["beneficeNet", "Bénéfice Net"], ["caf", "CAF"],
      ];
      const resRows = resKeys.map(([k, label]) =>
        [label, ...YEARS.map(y => formatFcfa((computed.resultats[y] as any)[k]))]
      );
      autoTable(doc, {
        startY: 24,
        head: [["Rubrique", ...YEARS.map(String)]],
        body: resRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 6: Seuil de Rentabilité =====
      doc.addPage();
      addHeader("Seuil de Rentabilité");
      const srKeys: [string, string][] = [
        ["ca", "Chiffre d'Affaires"], ["chargesFixes", "Charges Fixes"], ["chargesVariables", "Charges Variables"],
        ["seuilCA", "Seuil Rentabilité"], ["seuilPct", "Seuil % CA"], ["pointMortJours", "Point Mort (jours)"],
        ["pointMortMois", "Point Mort (mois)"], ["margeSecurite", "Marge Sécurité %"],
      ];
      const srRows = srKeys.map(([k, label]) => {
        return [label, ...YEARS.map(y => {
          const v = (computed.seuilRentabilite[y] as any)[k];
          if (k === "seuilPct" || k === "margeSecurite") return v.toFixed(2) + "%";
          if (k === "pointMortJours") return v + " j";
          if (k === "pointMortMois") return v.toFixed(1) + " mois";
          return formatFcfa(v);
        })];
      });
      autoTable(doc, {
        startY: 24,
        head: [["Indicateur", ...YEARS.map(String)]],
        body: srRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 7: Bilan =====
      doc.addPage();
      addHeader("Bilan Prévisionnel");
      const bilanKeys: [string, string][] = [
        ["actifImmo", "Actif Immobilisé"], ["actifCirculant", "Actif Circulant"], ["tresorerieActif", "Trésorerie Actif"],
        ["totalActif", "TOTAL ACTIF"], ["capitauxPropres", "Capitaux Propres"], ["dettesFinancieres", "Dettes Financières"],
        ["passifCirculant", "Passif Circulant"], ["totalPassif", "TOTAL PASSIF"],
      ];
      const bilanRows = bilanKeys.map(([k, label]) =>
        [label, ...YEARS.map(y => formatFcfa((computed.bilan[y] as any)[k]))]
      );
      autoTable(doc, {
        startY: 24,
        head: [["Rubrique", ...YEARS.map(String)]],
        body: bilanRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      // ===== PAGE 8: Plan de Financement =====
      doc.addPage();
      addHeader("Plan de Financement");
      const pfKeys: [string, string][] = [
        ["caf", "CAF"], ["capitalSocial", "Capital Social"], ["augmentationCapital", "Augmentation Capital"],
        ["empruntsLT", "Emprunts LT"], ["totalRessources", "TOTAL RESSOURCES"],
        ["investissements", "Investissements"], ["remboursementEmprunt", "Remb. Emprunt"],
        ["dividendes", "Dividendes"], ["totalEmplois", "TOTAL EMPLOIS"],
        ["soldePeriode", "Solde Période"], ["tresorerieCumulee", "Trésorerie Cumulée"],
      ];
      const pfRows = pfKeys.map(([k, label]) =>
        [label, ...YEARS.map(y => formatFcfa((computed.planFinancement[y] as any)[k]))]
      );
      autoTable(doc, {
        startY: 24,
        head: [["Rubrique", ...YEARS.map(String)]],
        body: pfRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 42, 71] },
        theme: "grid",
      });
      addFooter(pageNum++);

      doc.save("KENENERGIE_Business_Plan_2027-2031.pdf");
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} variant="outline" size="sm" className="gap-1.5">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      Exporter PDF Business Plan
    </Button>
  );
}
