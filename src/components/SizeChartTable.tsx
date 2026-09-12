import { useState } from "react";
import { sizeCharts, type GarmentType } from "@/data/sizeCharts";

interface SizeChartTableProps {
  garmentType: GarmentType;
}

export const SizeChartTable = ({ garmentType }: SizeChartTableProps) => {
  const chart = sizeCharts[garmentType];
  const hasBoth = !!chart.mens && !!chart.womens;
  const [view, setView] = useState<"mens" | "womens">(chart.mens ? "mens" : "womens");

  const rows = (view === "mens" ? chart.mens : chart.womens) ?? chart.womens;
  const showUsSize = rows.some((r) => r.usSize);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold">Size Chart</h3>
        {hasBoth && (
          <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
            <button
              type="button"
              onClick={() => setView("mens")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                view === "mens" ? "bg-primary text-primary-foreground" : "hover:bg-muted/40"
              }`}
            >
              Men's
            </button>
            <button
              type="button"
              onClick={() => setView("womens")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                view === "womens" ? "bg-primary text-primary-foreground" : "hover:bg-muted/40"
              }`}
            >
              Women's
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground">
              <th className="text-left font-medium px-4 py-2">Size</th>
              {showUsSize && <th className="text-left font-medium px-4 py-2">US Size</th>}
              <th className="text-left font-medium px-4 py-2">{chart.measurementLabel}</th>
              <th className="text-left font-medium px-4 py-2">Length</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.size} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                <td className="px-4 py-2 font-semibold">{row.size}</td>
                {showUsSize && <td className="px-4 py-2 text-muted-foreground">{row.usSize ?? "—"}</td>}
                <td className="px-4 py-2 text-muted-foreground">{row.measurement}</td>
                <td className="px-4 py-2 text-muted-foreground">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!chart.mens && (
        <p className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
          This style is cut as women's fit only.
        </p>
      )}
    </div>
  );
};
