import { cn } from "@/lib/utils";

interface Col {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  bold?: boolean;
  className?: string;
}

interface Row {
  [key: string]: string | number | boolean | undefined;
  _section?: boolean; // section title row
  _total?: boolean;   // totals row
  _sub?: boolean;     // sub-item (indented)
}

interface FinTableProps {
  cols: Col[];
  rows: Row[];
  className?: string;
  compact?: boolean;
}

export default function FinTable({ cols, rows, className, compact }: FinTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
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
