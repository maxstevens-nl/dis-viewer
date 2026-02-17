import { Fragment, useState, useCallback, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

  const getSpecialismePatientCount = useCallback(
    (specialismeCd: string, year: number) => {
      if (!factDbcData) return 0;
      let total = 0;
      factDbcData.forEach((row) => {
        if (
          row.behandelendSpecialismeCd === specialismeCd &&
          row.jaar === year
        ) {
          total += row.aantalPatPerZpd;
        }
      });
      return total;
    },
    [factDbcData]
  );

  const getDiagnosesForSpecialismAndYear = useCallback(
    (specialismeCd: string, year: number) => {
      const diagnosesByCode = new Map<
        string,
        { diagnoseCd: string; diagnoseOms: string; patientCount: number }
      >();

      medicalUsageData
        .filter(
          (row) => row.specialismeCd === specialismeCd && row.jaar === year
        )
        .forEach((row) => {
          const existing = diagnosesByCode.get(row.diagnoseCd);
          if (existing) {
            existing.patientCount += row.aantalPatienten;
          } else {
            diagnosesByCode.set(row.diagnoseCd, {
              diagnoseCd: row.diagnoseCd,
              diagnoseOms: row.diagnoseOms,
              patientCount: row.aantalPatienten,
            });
          }
        });

      return Array.from(diagnosesByCode.values()).sort((a, b) =>
        a.diagnoseOms.localeCompare(b.diagnoseOms)
      );
    },
    [medicalUsageData]
  );

  const toggleSpecialism = useCallback((specialismeCd: string) => {
    setExpandedSpecialisms((prev) => {
      const next = new Set(prev);
      if (next.has(specialismeCd)) {
        next.delete(specialismeCd);
      } else {
        next.add(specialismeCd);
      }
      return next;
    });
  }, []);

  if (specialismeList.length === 0) return null;

  return (
    <div className="flex-1">
      <div className="mb-8">
        {availableYears.length > 0 && (
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
        )}
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left border-b font-medium text-muted-foreground w-8"></th>
              <th className="p-3 text-left border-b font-medium text-muted-foreground max-w-0">
                Specialisme
              </th>
              <th className="p-3 text-right border-b font-medium text-muted-foreground w-24 shrink-0">
                Patiënten
              </th>
            </tr>
          </thead>
          <tbody>
            {specialismeList.map((item, index) => {
              const isExpanded = expandedSpecialisms.has(item.specialismeCd);
              const diagnoses = getDiagnosesForSpecialismAndYear(
                item.specialismeCd,
                selectedYear
              );
              const hasDiagnoses = diagnoses.length > 0;
              const baseRowClass =
                index % 2 === 0 ? "bg-background" : "bg-muted/30";
              const isLastSpecialism = index === specialismeList.length - 1;
              const isLastDiagnosisGroup = !hasDiagnoses || !isExpanded;
              const patientCount = getSpecialismePatientCount(
                item.specialismeCd,
                selectedYear
              );

              return (
                <Fragment key={item.specialismeCd}>
                  <tr
                    className={`${baseRowClass} ${hasDiagnoses ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    onClick={() =>
                      hasDiagnoses && toggleSpecialism(item.specialismeCd)
                    }
                  >
                    <td
                      className={`p-3 ${isLastSpecialism && isLastDiagnosisGroup ? "" : "border-b"}`}
                    >
                      {hasDiagnoses && (
                        <span className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-3 max-w-0 ${isLastSpecialism && isLastDiagnosisGroup ? "" : "border-b"}`}
                    >
                      <div className="truncate text-muted-foreground">
                        <span className="font-mono text-sm text-foreground">
                          {item.specialismeCd}
                        </span>
                        <span> - {item.specialismeOms}</span>
                      </div>
                    </td>
                    <td
                      className={`p-3 text-right ${isLastSpecialism && isLastDiagnosisGroup ? "" : "border-b"}`}
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
                          className={`${baseRowClass} ${diagIndex % 2 === 0 ? "bg-opacity-50" : ""}`}
                        >
                          <td
                            className={`p-2 ${isLastSpecialism && diagIndex === diagnoses.length - 1 ? "" : "border-b"}`}
                          ></td>
                          <td
                            className={`p-2 pl-10 max-w-0 ${isLastSpecialism && diagIndex === diagnoses.length - 1 ? "" : "border-b"}`}
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
                            className={`p-2 text-right pr-6 ${isLastSpecialism && diagIndex === diagnoses.length - 1 ? "" : "border-b"}`}
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
      </div>
    </div>
  );
}
