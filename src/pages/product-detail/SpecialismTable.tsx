import { Fragment, useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { MedicalUsageRow } from "./types.ts";
import type { FactDbc } from "../../schema.ts";

interface SpecialismItem {
  specialismeCd: string;
  specialismeOms: string;
  jaar: number;
}

interface SpecialismTableProps {
  factDbcData: readonly FactDbc[] | undefined;
  specialismenMap: Map<string, string>;
  medicalUsageData: MedicalUsageRow[];
}

export function SpecialismTable({
  factDbcData,
  specialismenMap,
  medicalUsageData,
}: SpecialismTableProps) {
  const specialismeList: SpecialismItem[] = useMemo(() => {
    if (!factDbcData) return [];
    const specialismesByYear = new Map<string, number>();
    factDbcData.forEach((row) => {
      const currentYear = specialismesByYear.get(row.behandelendSpecialismeCd);
      if (!currentYear || row.jaar > currentYear) {
        specialismesByYear.set(row.behandelendSpecialismeCd, row.jaar);
      }
    });
    return Array.from(specialismesByYear.entries())
      .map(([specialismeCd, jaar]) => ({
        specialismeCd,
        specialismeOms: specialismenMap.get(specialismeCd) || specialismeCd,
        jaar,
      }))
      .sort((a, b) => a.specialismeOms.localeCompare(b.specialismeOms));
  }, [factDbcData, specialismenMap]);

  const availableYears = useMemo(() => {
    if (!factDbcData) return [];
    const years = new Set<number>();
    factDbcData.forEach((row) => years.add(row.jaar));
    return Array.from(years).sort((a, b) => b - a);
  }, [factDbcData]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return availableYears[0] || new Date().getFullYear();
  });

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const [expandedSpecialisms, setExpandedSpecialisms] = useState<Set<string>>(
    new Set()
  );

  // Precompute patient counts: key = "specialismeCd|year" -> total patients
  const patientCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!factDbcData) return map;
    factDbcData.forEach((row) => {
      const key = `${row.behandelendSpecialismeCd}|${row.jaar}`;
      map.set(key, (map.get(key) || 0) + row.aantalPatPerZpd);
    });
    return map;
  }, [factDbcData]);

  // Precompute diagnoses: key = "specialismeCd|year" -> sorted diagnose list
  const diagnosesMap = useMemo(() => {
    const grouped = new Map<
      string,
      Map<string, { diagnoseCd: string; diagnoseOms: string; patientCount: number }>
    >();
    medicalUsageData.forEach((row) => {
      const groupKey = `${row.specialismeCd}|${row.jaar}`;
      let byCode = grouped.get(groupKey);
      if (!byCode) {
        byCode = new Map();
        grouped.set(groupKey, byCode);
      }
      const existing = byCode.get(row.diagnoseCd);
      if (existing) {
        existing.patientCount += row.aantalPatienten;
      } else {
        byCode.set(row.diagnoseCd, {
          diagnoseCd: row.diagnoseCd,
          diagnoseOms: row.diagnoseOms,
          patientCount: row.aantalPatienten,
        });
      }
    });

    const result = new Map<
      string,
      { diagnoseCd: string; diagnoseOms: string; patientCount: number }[]
    >();
    grouped.forEach((byCode, key) => {
      result.set(
        key,
        Array.from(byCode.values()).sort((a, b) =>
          a.diagnoseOms.localeCompare(b.diagnoseOms)
        )
      );
    });
    return result;
  }, [medicalUsageData]);

  function toggleSpecialism(specialismeCd: string) {
    setExpandedSpecialisms((prev) => {
      const next = new Set(prev);
      if (next.has(specialismeCd)) {
        next.delete(specialismeCd);
      } else {
        next.add(specialismeCd);
      }
      return next;
    });
  }

  if (specialismeList.length === 0) return null;

  return (
    <Card className="flex-1 rounded-lg shadow-none text-left overflow-hidden">
      {availableYears.length > 0 && (
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {Math.min(...availableYears)}
            </span>
            <div className="flex-1">
              <Slider
                value={[selectedYear]}
                min={Math.min(...availableYears)}
                max={Math.max(...availableYears)}
                step={1}
                onValueChange={(value) => setSelectedYear(value[0])}
                showValue
                marks={availableYears}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.max(...availableYears)}
            </span>
          </div>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-8"></th>
            <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Diagnose
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 shrink-0">
              Patiënten
            </th>
          </tr>
        </thead>
        <tbody>
          {specialismeList.map((item, index) => {
            const isExpanded = expandedSpecialisms.has(item.specialismeCd);
            const diagnoses = diagnosesMap.get(
              `${item.specialismeCd}|${selectedYear}`
            ) ?? [];
            const hasDiagnoses = diagnoses.length > 0;
            const isLastSpecialism = index === specialismeList.length - 1;
            const isLastDiagnosisGroup = !hasDiagnoses || !isExpanded;
            const patientCount = patientCountMap.get(
              `${item.specialismeCd}|${selectedYear}`
            ) ?? 0;

            return (
              <Fragment key={item.specialismeCd}>
                <tr
                  className={`${hasDiagnoses ? "cursor-pointer hover:bg-muted/50" : ""} transition-colors`}
                  onClick={() =>
                    hasDiagnoses && toggleSpecialism(item.specialismeCd)
                  }
                >
                  <td
                    className={`py-2.5 px-3 ${isLastSpecialism && isLastDiagnosisGroup ? "" : "border-b"}`}
                  >
                    {hasDiagnoses && (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Inklappen" : "Uitklappen"} ${item.specialismeOms}`}
                        className="text-muted-foreground bg-transparent border-none p-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSpecialism(item.specialismeCd);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                  <td
                    className={`py-2.5 px-3 max-w-0 ${isLastSpecialism && isLastDiagnosisGroup ? "" : "border-b"}`}
                  >
                    <div className="truncate text-muted-foreground">
                      <span className="font-mono text-sm text-foreground">
                        {item.specialismeCd}
                      </span>
                      <span> - {item.specialismeOms}</span>
                    </div>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${isLastSpecialism && isLastDiagnosisGroup ? "" : "border-b"}`}
                  >
                    <span className="text-xs text-muted-foreground font-mono">
                      {patientCount > 0
                        ? patientCount.toLocaleString("nl-NL")
                        : "-"}
                    </span>
                  </td>
                </tr>
                {isExpanded && hasDiagnoses && (
                  <>
                    {diagnoses.map((diag, diagIndex) => (
                      <tr
                        key={`${item.specialismeCd}-${diag.diagnoseCd}`}
                        className="bg-muted/20"
                      >
                        <td
                          className={`py-2 px-3 ${isLastSpecialism && diagIndex === diagnoses.length - 1 ? "" : "border-b"}`}
                        ></td>
                        <td
                          className={`py-2 pl-10 pr-3 max-w-0 ${isLastSpecialism && diagIndex === diagnoses.length - 1 ? "" : "border-b"}`}
                        >
                          <div className="truncate text-muted-foreground">
                            <span className="font-mono text-xs text-foreground">
                              {diag.diagnoseCd}
                            </span>
                            <span className="text-xs">
                              {" "}
                              - {diag.diagnoseOms}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${isLastSpecialism && diagIndex === diagnoses.length - 1 ? "" : "border-b"}`}
                        >
                          <span className="text-xs text-muted-foreground font-mono">
                            {diag.patientCount > 0
                              ? diag.patientCount.toLocaleString("nl-NL")
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
