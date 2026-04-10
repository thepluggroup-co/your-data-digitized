import PageHeader from "@/components/kenenergie/PageHeader";
import FinTable from "@/components/kenenergie/FinTable";
import { bilan, YEARS, formatFcfa } from "@/lib/kenenergie-data";

export default function Bilan() {
  const cols = [
    { key: "label", label: "Rubrique", align: "left" as const },
    ...YEARS.map((y) => ({ key: y.toString(), label: y.toString(), align: "right" as const })),
  ];

  const makeRow = (label: string, fn: (y: number) => number, opts?: { total?: boolean; sub?: boolean }) => ({
    label,
    ...Object.fromEntries(YEARS.map((y) => [y.toString(), formatFcfa(fn(y))])),
    _total: opts?.total,
    _sub: opts?.sub,
  });

  const actifRows = [
    { _section: true, _label: "ACTIF" },
    makeRow("Actif immobilisé net (I)", (y) => bilan[y].actifImmo, { sub: true }),
    makeRow("Actif circulant net (II)", (y) => bilan[y].actifCirculant, { sub: true }),
    makeRow("Trésorerie – Actif (III)", (y) => bilan[y].tresorerieActif, { sub: true }),
    makeRow("TOTAL ACTIF (I+II+III)", (y) => bilan[y].totalActif, { total: true }),
    { _section: true, _label: "PASSIF" },
    makeRow("Capitaux propres (I)", (y) => bilan[y].capitauxPropres, { sub: true }),
    makeRow("Dettes financières LT (II)", (y) => bilan[y].dettesFinancieres, { sub: true }),
    makeRow("Passif circulant (III)", (y) => bilan[y].passifCirculant, { sub: true }),
    makeRow("Trésorerie – Passif (IV)", (y) => bilan[y].tresoreriePassif, { sub: true }),
    makeRow("TOTAL PASSIF", (y) => bilan[y].totalPassif, { total: true }),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bilans Prévisionnels" subtitle="Structure du bilan sur 5 ans (2027–2031)" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {YEARS.map((y) => (
          <div key={y} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold mb-2">{y}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capitaux propres</span>
                <span className="font-mono text-positive font-semibold">{formatFcfa(bilan[y].capitauxPropres, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dettes LT</span>
                <span className="font-mono text-negative font-semibold">{formatFcfa(bilan[y].dettesFinancieres, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total actif</span>
                <span className="font-mono font-bold">{formatFcfa(bilan[y].totalActif, true)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h2 className="text-primary-foreground font-semibold text-sm">Bilan Consolidé</h2>
        </div>
        <FinTable cols={cols} rows={actifRows} compact exportName="Bilan_Previsionnel" />
      </div>
    </div>
  );
}
