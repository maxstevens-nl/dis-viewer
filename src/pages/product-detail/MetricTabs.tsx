import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PriceHistoryChart } from "./PriceHistoryChart.tsx";
import type { TimeSeriesEntry } from "./types.ts";

interface MetricTabsProps {
  sellingPriceHistory: TimeSeriesEntry[];
  patientHistory: TimeSeriesEntry[];
  mostRecentCompletePrice: TimeSeriesEntry | null;
  mostRecentCompletePatients: TimeSeriesEntry | null;
  priceProvisionalYear: number | null;
  patientProvisionalYear: number | null;
}

export function MetricTabs({
  sellingPriceHistory,
  patientHistory,
  mostRecentCompletePrice,
  mostRecentCompletePatients,
  priceProvisionalYear,
  patientProvisionalYear,
}: MetricTabsProps) {
  const [selectedMetric, setSelectedMetric] = useState<"price" | "patients">(
    "price"
  );

  return (
    <Card className="flex-1 rounded-lg shadow-none text-left overflow-hidden">
      <div className="flex border-b border-muted">
        <button
          onClick={() => setSelectedMetric("price")}
          className={`flex-1 pb-4 pt-6 px-6 text-left transition-colors relative bg-transparent border-none appearance-none focus:outline-none ${
            selectedMetric === "price"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="text-sm font-medium">Gemiddelde verkoopprijs</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-mono font-semibold">
              {mostRecentCompletePrice
                ? `€ ${mostRecentCompletePrice.value.toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "-"}
            </span>
            {mostRecentCompletePrice && (
              <span className="text-sm text-muted-foreground">
                ({mostRecentCompletePrice.jaar})
              </span>
            )}
          </div>
          {selectedMetric === "price" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <div className="w-[1px] bg-border self-stretch" />
        <button
          onClick={() => setSelectedMetric("patients")}
          className={`flex-1 pb-4 pt-6 px-6 text-left transition-colors relative bg-transparent border-none appearance-none focus:outline-none ${
            selectedMetric === "patients"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="text-sm font-medium">Aantal patiënten</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-mono font-semibold">
              {mostRecentCompletePatients
                ? mostRecentCompletePatients.value.toLocaleString("nl-NL")
                : "-"}
            </span>
            {mostRecentCompletePatients && (
              <span className="text-sm text-muted-foreground">
                ({mostRecentCompletePatients.jaar})
              </span>
            )}
          </div>
          {selectedMetric === "patients" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>
      <div className="px-6 pb-6">
        {(selectedMetric === "price"
          ? sellingPriceHistory
          : patientHistory
        ).length > 1 && (
          <PriceHistoryChart
            data={
              selectedMetric === "price" ? sellingPriceHistory : patientHistory
            }
            format={selectedMetric === "price" ? "currency" : "number"}
            provisionalYear={
              selectedMetric === "price"
                ? priceProvisionalYear
                : patientProvisionalYear
            }
          />
        )}
      </div>
    </Card>
  );
}
