import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Col {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  bold?: boolean;
  className?: string;
}

interface Row {
  [key: string]: string | number | boolean | undefined;
  _section?: boolean;
  _total?: boolean;
  _sub?: boolean;
}

interface FinTableProps {
  cols: Col[];
  rows: Row[];
  className?: string;
  compact?: boolean;
  exportName?: string;
}

// Formats Excel conformes au fichier source
const FMT_NUMBER = '#,##0;(#,##0);"-"';        // 1 234 / (1 234) / -
const FMT_PCT    = '0.0%;(0.0%);"-"';           // 12,3 % / (12,3 %) / -
const FMT_RATIO  = '0.00"\u00d7"';              // 1,25×

// Tente de re-parser une chaîne formatée FR vers un nombre brut + son format Excel
function parseFormatted(v: unknown): { num: number; fmt: string } | null {
  if (typeof v === "number") return { num: v, fmt: FMT_NUMBER };
  if (typeof v !== "string") return null;
  let s = v.trim();
  if (s === "" || s === "-" || s === "—") return null;
  let isPct = false, isRatio = false, neg = false, scale = 1;
  if (/[×x]$/.test(s)) { isRatio = true; s = s.slice(0, -1); }
  if (/%$/.test(s))    { isPct = true;   s = s.slice(0, -1); }
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  // retire suffixes connus (FCFA, F, Mrd, M) et applique le facteur d'échelle correspondant
  const suffixMatch = s.match(/\s*(FCFA|Mrd|Mds|M|F)$/i);
  if (suffixMatch) {
    const suf = suffixMatch[1].toLowerCase();
    if (suf === "mrd" || suf === "mds") scale = 1_000_000_000;
    else if (suf === "m") scale = 1_000_000;
    s = s.slice(0, -suffixMatch[0].length);
  }
  // espaces (incl. NBSP) = séparateur milliers ; virgule = décimale
  s = s.replace(/[\s\u00A0]/g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const num = (neg ? -n : n) * scale;
  if (isPct)   return { num: num / 100, fmt: FMT_PCT };
  if (isRatio) return { num, fmt: FMT_RATIO };
  return { num, fmt: FMT_NUMBER };
}

function exportToExcel(cols: Col[], rows: Row[], name: string) {
  const headerLabels = cols.map(c => c.label);
  const aoa: (string | number | boolean | null)[][] = [headerLabels];
  // Mémorise les méta (format, gras pour totaux/sections) par cellule
  const meta: { fmt?: string; bold?: boolean }[][] = [headerLabels.map(() => ({ bold: true }))];

  for (const row of rows) {
    if (row._section) {
      const line: (string | number | boolean | null)[] = [String(row._label ?? "")];
      const m: { fmt?: string; bold?: boolean }[] = [{ bold: true }];
      for (let i = 1; i < cols.length; i++) { line.push(null); m.push({}); }
      aoa.push(line); meta.push(m);
      continue;
    }
    const isTotal = !!row._total;
    const line: (string | number | boolean | null)[] = [];
    const m: { fmt?: string; bold?: boolean }[] = [];
    cols.forEach((col, i) => {
      const raw = row[col.key];
      if (i === 0) { line.push(raw == null ? "" : String(raw)); m.push({ bold: isTotal }); return; }
      const parsed = parseFormatted(raw);
      if (parsed)                        { line.push(parsed.num); m.push({ fmt: parsed.fmt, bold: isTotal }); }
      else if (typeof raw === "boolean") { line.push(raw); m.push({ bold: isTotal }); }
      else                                { line.push(raw == null ? null : String(raw)); m.push({ bold: isTotal }); }
    });
    aoa.push(line); meta.push(m);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Applique formats numériques et mise en gras cellule par cellule
  meta.forEach((rowMeta, r) => {
    rowMeta.forEach((cellMeta, c) => {
      if (!cellMeta.fmt && !cellMeta.bold) return;
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) return;
      if (cellMeta.fmt && cell.t === "n") cell.z = cellMeta.fmt;
      if (cellMeta.bold) cell.s = { font: { bold: true } };
    });
  });
  // Largeurs colonnes : 1ère large (libellés), suivantes étroites (valeurs)
  ws["!cols"] = cols.map((_, i) => ({ wch: i === 0 ? 42 : 16 }));
  // Figer en-tête et colonne libellé
  ws["!freeze"] = { xSplit: 1, ySplit: 1 } as never;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `${name}.xlsx`);
}

export default function FinTable({ cols, rows, className, compact, exportName }: FinTableProps) {
  const fileName = exportName || "export";

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <div className="flex justify-end px-3 py-2 border-b border-border/50 bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => exportToExcel(cols, rows, fileName)}
        >
          <Download className="h-3.5 w-3.5" />
          Exporter Excel
        </Button>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="header-gradient">
            {cols.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "table-header-cell text-left",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (row._section) {
              return (
                <tr key={i}>
                  <td colSpan={cols.length} className="section-title-row px-3 py-1.5">
                    {row._label as string}
                  </td>
                </tr>
              );
            }
            return (
              <tr
                key={i}
                className={cn(
                  "border-t border-border/50 row-lift",
                  row._total
                    ? "bg-primary/8 font-semibold border-t-2 border-primary/20"
                    : i % 2 === 0
                    ? "bg-white"
                    : "bg-muted/20"
                )}
              >
                {cols.map((col) => {
                  const val = row[col.key];
                  const isLabel = col.key === cols[0].key;
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        compact ? "px-3 py-1.5" : "px-3 py-2",
                        isLabel && "text-foreground",
                        !isLabel && "num-cell",
                        col.align === "left" && "text-left",
                        col.align === "center" && "text-center",
                        row._sub && isLabel && "pl-6 text-muted-foreground text-xs",
                        row._total && "font-bold",
                        col.className
                      )}
                    >
                      {val !== undefined ? String(val) : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
