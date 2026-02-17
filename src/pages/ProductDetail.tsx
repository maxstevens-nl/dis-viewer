import { useQuery } from "@rocicorp/zero/react";
import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { queries } from "../queries.ts";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MedicalUsageRow, TimeSeriesEntry } from "./product-detail/types.ts";
import { MetricTabs } from "./product-detail/MetricTabs.tsx";
import { SpecialismTable } from "./product-detail/SpecialismTable.tsx";

const PROVISIONAL_YEAR = 2025;

function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const [product, productResult] = useQuery(
    id ? queries.zorgproducten.byCode(id) : null
  );

  const [factDbcData] = useQuery(
    id ? queries.factDbc.byProduct({ zorgproductCd: id }) : null
  );

  const [allSpecialismen] = useQuery(queries.refSpecialisme.all());
  const [allDiagnoses] = useQuery(queries.refDiagnose.all());

  const specialismenMap = useMemo(() => {
    const map = new Map<string, string>();
    allSpecialismen?.forEach((s) => map.set(s.specialismeCd, s.omschrijving));
    return map;
  }, [allSpecialismen]);

  const diagnosesMap = useMemo(() => {
    const map = new Map<string, string>();
    allDiagnoses?.forEach((d) =>
      map.set(`${d.diagnoseCd}|${d.specialismeCd}`, d.diagnoseOmschrijving)
    );
    return map;
  }, [allDiagnoses]);

  const medicalUsageData: MedicalUsageRow[] = useMemo(() => {
    if (!factDbcData) return [];
    return factDbcData.map((row) => ({
      jaar: row.jaar,
      specialismeCd: row.behandelendSpecialismeCd,
      specialismeOms:
        specialismenMap.get(row.behandelendSpecialismeCd) || "Onbekend",
      diagnoseCd: row.typerendeDiagnoseCd,
      diagnoseOms:
        diagnosesMap.get(
          `${row.typerendeDiagnoseCd}|${row.behandelendSpecialismeCd}`
        ) || "Onbekend",
      aantalPatienten: row.aantalPatPerZpd,
    }));
  }, [factDbcData, specialismenMap, diagnosesMap]);

  const sellingPriceHistory: TimeSeriesEntry[] = useMemo(() => {
    if (!factDbcData) return [];
    const pricesByYear = new Map<number, number>();
    factDbcData.forEach((row) => {
      if (row.gemiddeldeVerkoopprijs && !pricesByYear.has(row.jaar)) {
        pricesByYear.set(row.jaar, row.gemiddeldeVerkoopprijs);
      }
    });
    return Array.from(pricesByYear.entries())
      .map(([jaar, value]) => ({ jaar, value }))
      .sort((a, b) => a.jaar - b.jaar);
  }, [factDbcData]);

  const patientHistory: TimeSeriesEntry[] = useMemo(() => {
    if (!factDbcData) return [];
    const patientsByYear = new Map<number, number>();
    factDbcData.forEach((row) => {
      if (row.aantalPatPerZpd) {
        const current = patientsByYear.get(row.jaar) || 0;
        patientsByYear.set(row.jaar, current + row.aantalPatPerZpd);
      }
    });

    return Array.from(patientsByYear.entries())
      .map(([jaar, value]) => ({ jaar, value }))
      .sort((a, b) => a.jaar - b.jaar);
  }, [factDbcData]);

  const priceProvisionalYear = sellingPriceHistory.some(
    (entry) => entry.jaar === PROVISIONAL_YEAR
  )
    ? PROVISIONAL_YEAR
    : null;
  const patientProvisionalYear = patientHistory.some(
    (entry) => entry.jaar === PROVISIONAL_YEAR
  )
    ? PROVISIONAL_YEAR
    : null;

  const getMostRecentComplete = (
    data: TimeSeriesEntry[]
  ): TimeSeriesEntry | null => {
    if (data.length === 0) return null;
    const has2025 = data.some((entry) => entry.jaar === PROVISIONAL_YEAR);
    if (has2025 && data.length > 1) {
      return data[data.length - 2] || null;
    }
    return data[data.length - 1];
  };

  const mostRecentCompletePrice = getMostRecentComplete(sellingPriceHistory);
  const mostRecentCompletePatients = getMostRecentComplete(patientHistory);

  const hasMetrics = sellingPriceHistory.length > 0 || patientHistory.length > 0;
  const hasSpecialisms = factDbcData && factDbcData.length > 0;

  if (productResult?.type !== "complete") {
    return null;
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar lijst
        </Link>

        <Card className="rounded-lg border-destructive/40 bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Product niet gevonden</CardTitle>
            <CardDescription>
              Het opgevraagde product "{id}" kon niet worden gevonden in
              de database.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 text-left">
      <div className="space-y-4 pt-2">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar lijst
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-left">
            {product.consumentOms}
          </h1>
          <p className="text-base text-muted-foreground text-left">
            {product.latijnOms} • {product.zorgproductCd}
          </p>
        </div>
      </div>

      {(hasMetrics || hasSpecialisms) && (
        <div className="flex flex-col md:flex-row md:items-stretch">
          {hasMetrics && (
            <MetricTabs
              sellingPriceHistory={sellingPriceHistory}
              patientHistory={patientHistory}
              mostRecentCompletePrice={mostRecentCompletePrice}
              mostRecentCompletePatients={mostRecentCompletePatients}
              priceProvisionalYear={priceProvisionalYear}
              patientProvisionalYear={patientProvisionalYear}
            />
          )}

          {hasMetrics && hasSpecialisms && (
            <div className="hidden md:block mx-4 w-[1px] bg-border self-stretch" />
          )}

          <SpecialismTable
            factDbcData={factDbcData}
            specialismenMap={specialismenMap}
            medicalUsageData={medicalUsageData}
          />
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
