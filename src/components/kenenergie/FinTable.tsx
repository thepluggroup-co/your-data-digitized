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

function exportToExcel(cols: Col[], rows: Row[], name: string) {
  const data = rows.map((row) => {
    if (row._section) return { [cols[0].label]: row._label };
    const obj: Record<string, string | number | boolean | undefined> = {};
    for (const col of cols) {
      obj[col.label] = row[col.key];
    }
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
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
          <tr>
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
                  "border-t border-border/50 transition-colors",
                  row._total
                    ? "bg-primary/8 font-semibold border-t-2 border-primary/20"
                    : i % 2 === 0
                    ? "bg-white hover:bg-secondary/40"
                    : "bg-background hover:bg-secondary/40"
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
