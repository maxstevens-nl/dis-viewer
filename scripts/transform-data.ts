import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRawDir = path.join(rootDir, "data-raw");
const dataDir = path.join(rootDir, "data");

type ColumnMap = {
  out: string;
  in: string;
};

type CsvConfig = {
  input: string;
  output: string;
  columns: ColumnMap[];
};

const csvConfig: Record<string, CsvConfig> = {
  ref_specialisme: {
    input: "06_REF_SPC.csv",
    output: "ref_specialisme.csv",
    columns: [
      { out: "specialisme_cd", in: "SPECIALISME_CD" },
      { out: "omschrijving", in: "OMSCHRIJVING" },
      { out: "versie", in: "VERSIE" },
      { out: "datum_bestand", in: "DATUM_BESTAND" },
      { out: "peildatum", in: "PEILDATUM" },
    ],
  },
  ref_zorgproduct: {
    input: "05_REF_ZPD.csv",
    output: "ref_zorgproduct.csv",
    columns: [
      { out: "zorgproduct_cd", in: "ZORGPRODUCT_CD" },
      { out: "latijn_oms", in: "LATIJN_OMS" },
      { out: "consument_oms", in: "CONSUMENT_OMS" },
      { out: "declaratie_verzekerd_cd", in: "DECLARATIE_VERZEKERD_CD" },
      { out: "declaratie_onverzekerd_cd", in: "DECLARATIE_ONVERZEKERD_CD" },
      { out: "versie", in: "VERSIE" },
      { out: "datum_bestand", in: "DATUM_BESTAND" },
      { out: "peildatum", in: "PEILDATUM" },
    ],
  },
  ref_diagnose: {
    input: "04_REF_DGN.csv",
    output: "ref_diagnose.csv",
    columns: [
      { out: "diagnose_cd", in: "DIAGNOSE_CD" },
      { out: "specialisme_cd", in: "SPECIALISME_CD" },
      { out: "diagnose_omschrijving", in: "DIAGNOSE_OMSCHRIJVING" },
      { out: "versie", in: "VERSIE" },
      { out: "datum_bestand", in: "DATUM_BESTAND" },
      { out: "peildatum", in: "PEILDATUM" },
    ],
  },
  fact_dbc: {
    input: "01_DBC.csv",
    output: "fact_dbc.csv",
    columns: [
      { out: "jaar", in: "JAAR" },
      { out: "behandelend_specialisme_cd", in: "BEHANDELEND_SPECIALISME_CD" },
      { out: "typerende_diagnose_cd", in: "TYPERENDE_DIAGNOSE_CD" },
      { out: "zorgproduct_cd", in: "ZORGPRODUCT_CD" },
      { out: "aantal_pat_per_zpd", in: "AANTAL_PAT_PER_ZPD" },
      { out: "aantal_subtraject_per_zpd", in: "AANTAL_SUBTRAJECT_PER_ZPD" },
      { out: "aantal_pat_per_diag", in: "AANTAL_PAT_PER_DIAG" },
      { out: "aantal_subtraject_per_diag", in: "AANTAL_SUBTRAJECT_PER_DIAG" },
      { out: "aantal_pat_per_spc", in: "AANTAL_PAT_PER_SPC" },
      { out: "aantal_subtraject_per_spc", in: "AANTAL_SUBTRAJECT_PER_SPC" },
      { out: "gemiddelde_verkoopprijs", in: "GEMIDDELDE_VERKOOPPRIJS" },
      { out: "versie", in: "VERSIE" },
      { out: "datum_bestand", in: "DATUM_BESTAND" },
      { out: "peildatum", in: "PEILDATUM" },
    ],
  },
  fact_dbc_profiel: {
    input: "02_DBC_PROFIEL.csv",
    output: "fact_dbc_profiel.csv",
    columns: [
      { out: "jaar", in: "JAAR" },
      { out: "behandelend_specialisme_cd", in: "BEHANDELEND_SPECIALISME_CD" },
      { out: "typerende_diagnose_cd", in: "TYPERENDE_DIAGNOSE_CD" },
      { out: "zorgproduct_cd", in: "ZORGPRODUCT_CD" },
      { out: "zorgactiviteit_cd", in: "ZORGACTIVITEIT_CD" },
      { out: "zorgprofielklasse_cd", in: "ZORGPROFIELKLASSE_CD" },
      { out: "aantal_pat", in: "AANTAL_PAT" },
      { out: "aantal_subtraject", in: "AANTAL_SUBTRAJECT" },
      { out: "aantal_zat", in: "AANTAL_ZAT" },
      { out: "som_aantal_zat", in: "SOM_AANTAL_ZAT" },
      { out: "versie", in: "VERSIE" },
      { out: "datum_bestand", in: "DATUM_BESTAND" },
      { out: "peildatum", in: "PEILDATUM" },
    ],
  },
};

const zorgactiviteitConfig = {
  input: "03_REF_ZAT.csv",
  outputZorgactiviteit: "ref_zorgactiviteit.csv",
  outputZorgprofielklasse: "ref_zorgprofielklasse.csv",
  zorgactiviteitColumns: [
    { out: "zorgactiviteit_cd", in: "ZORGACTIVITEIT_CD" },
    { out: "omschrijving", in: "OMSCHRIJVING" },
    { out: "zorgprofielklasse_cd", in: "ZORGPROFIELKLASSE_CD" },
    { out: "versie", in: "VERSIE" },
    { out: "datum_bestand", in: "DATUM_BESTAND" },
    { out: "peildatum", in: "PEILDATUM" },
  ],
  zorgprofielklasseColumns: [
    { out: "zorgprofielklasse_cd", in: "ZORGPROFIELKLASSE_CD" },
    { out: "zorgprofielklasse_oms", in: "ZORGPROFIELKLASSE_OMS" },
    { out: "versie", in: "VERSIE" },
    { out: "datum_bestand", in: "DATUM_BESTAND" },
    { out: "peildatum", in: "PEILDATUM" },
  ],
} satisfies {
  input: string;
  outputZorgactiviteit: string;
  outputZorgprofielklasse: string;
  zorgactiviteitColumns: ColumnMap[];
  zorgprofielklasseColumns: ColumnMap[];
};

const readCsv = async (filePath: string) => {
  const file = Bun.file(filePath);
  const content = await file.text();
  const parsed = Papa.parse<string[]>(content, {
    skipEmptyLines: true,
    beforeFirstChunk: (chunk) => chunk.replace(/^\uFEFF/, ""),
  });
  if (parsed.errors.length > 0) {
    const messages = parsed.errors
      .map((error) => error.message)
      .join("; ");
    throw new Error(`Failed to parse CSV ${filePath}: ${messages}`);
  }
  const rows = parsed.data.map((row) => row.map((value) => value ?? ""));
  if (rows.length === 0) {
    throw new Error(`CSV is empty: ${filePath}`);
  }
  const headers = rows[0];
  return { headers, rows: rows.slice(1) };
};

const ensureHeaders = (headers: string[], required: string[], label: string) => {
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`Missing headers in ${label}: ${missing.join(", ")}`);
  }
};

const logProgress = (label: string, current: number, total: number) => {
  const percent = Math.round((current / total) * 100);
  console.log(`${label}: ${current}/${total} (${percent}%)`);
};

const mapRows = (
  rows: string[][],
  headers: string[],
  columns: ColumnMap[],
  options?: { label?: string; logEvery?: number }
) => {
  const headerIndex = new Map<string, number>(
    headers.map((header, index) => [header, index])
  );
  ensureHeaders(
    headers,
    columns.map((column) => column.in),
    "input CSV"
  );
  const label = options?.label;
  const logEvery = options?.logEvery ?? 250000;
  const total = rows.length;
  const mapped = new Array<string[]>(total);
  for (let index = 0; index < total; index += 1) {
    const row = rows[index];
    mapped[index] = columns.map(
      (column) => row[headerIndex.get(column.in) ?? -1] ?? ""
    );
    if (label && (index + 1 === total || (index + 1) % logEvery === 0)) {
      logProgress(label, index + 1, total);
    }
  }
  return mapped;
};

const writeCsv = async (
  filePath: string,
  headers: string[],
  rows: string[][]
) => {
  const output = Papa.unparse(
    {
      fields: headers,
      data: rows,
    },
    {
      newline: "\n",
    }
  );
  const content = output.endsWith("\n") ? output : `${output}\n`;
  await Bun.write(filePath, content, { createPath: true });
};

const buildCsv = async ({ input, output, columns }: CsvConfig) => {
  console.log(`Transforming ${input} -> ${output}`);
  const inputPath = path.join(dataRawDir, input);
  const outputPath = path.join(dataDir, output);
  const { headers, rows } = await readCsv(inputPath);
  const mappedRows = mapRows(rows, headers, columns, {
    label: `Mapping ${output}`,
  });
  await writeCsv(
    outputPath,
    columns.map((column) => column.out),
    mappedRows
  );
  console.log(`Wrote ${mappedRows.length} rows to ${output}`);
};

const buildZorgactiviteitCsvs = async () => {
  console.log(
    `Transforming ${zorgactiviteitConfig.input} -> ${zorgactiviteitConfig.outputZorgactiviteit}`
  );
  const inputPath = path.join(dataRawDir, zorgactiviteitConfig.input);
  const outputZorgactiviteitPath = path.join(
    dataDir,
    zorgactiviteitConfig.outputZorgactiviteit
  );
  const outputZorgprofielklassePath = path.join(
    dataDir,
    zorgactiviteitConfig.outputZorgprofielklasse
  );
  const { headers, rows } = await readCsv(inputPath);

  const zorgactiviteitRows = mapRows(
    rows,
    headers,
    zorgactiviteitConfig.zorgactiviteitColumns,
    {
      label: `Mapping ${zorgactiviteitConfig.outputZorgactiviteit}`,
    }
  );

  const profielklasseMap = new Map<string, string[]>();
  const profielklasseColumns = zorgactiviteitConfig.zorgprofielklasseColumns;
  const headerIndex = new Map<string, number>(
    headers.map((header, index) => [header, index])
  );
  ensureHeaders(
    headers,
    profielklasseColumns.map((column) => column.in),
    "ref_zat CSV"
  );

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const key = row[headerIndex.get("ZORGPROFIELKLASSE_CD") ?? -1] ?? "";
    if (!profielklasseMap.has(key)) {
      profielklasseMap.set(
        key,
        profielklasseColumns.map(
          (column) => row[headerIndex.get(column.in) ?? -1] ?? ""
        )
      );
    }
    if (index + 1 === rows.length || (index + 1) % 250000 === 0) {
      logProgress(
        `Mapping ${zorgactiviteitConfig.outputZorgprofielklasse}`,
        index + 1,
        rows.length
      );
    }
  }

  await writeCsv(
    outputZorgactiviteitPath,
    zorgactiviteitConfig.zorgactiviteitColumns.map((column) => column.out),
    zorgactiviteitRows
  );
  console.log(
    `Wrote ${zorgactiviteitRows.length} rows to ${zorgactiviteitConfig.outputZorgactiviteit}`
  );

  await writeCsv(
    outputZorgprofielklassePath,
    zorgactiviteitConfig.zorgprofielklasseColumns.map((column) => column.out),
    Array.from(profielklasseMap.values())
  );
  console.log(
    `Wrote ${profielklasseMap.size} rows to ${zorgactiviteitConfig.outputZorgprofielklasse}`
  );
};

const run = async () => {
  await buildCsv(csvConfig.ref_specialisme);
  await buildCsv(csvConfig.ref_zorgproduct);
  await buildCsv(csvConfig.ref_diagnose);
  await buildCsv(csvConfig.fact_dbc);
  await buildCsv(csvConfig.fact_dbc_profiel);
  await buildZorgactiviteitCsvs();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
