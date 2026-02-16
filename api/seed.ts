import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  factDbc,
  factDbcProfiel,
  refDiagnose,
  refSpecialisme,
  refZorgactiviteit,
  refZorgproduct,
  refZorgprofielklasse,
} from "./drizzleSchema.ts";
import { db, pool } from "./db.ts";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const CHUNK_SIZE = 1000;

type CsvRow = string[];

function parseCsv(text: string) {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === "\"") {
        const nextChar = text[i + 1];
        if (nextChar === "\"") {
          field += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function buildHeaderIndex(headerRow: CsvRow) {
  const index = new Map<string, number>();
  headerRow.forEach((value, i) => {
    index.set(value.trim(), i);
  });
  return index;
}

function readCell(row: CsvRow, headerIndex: Map<string, number>, header: string) {
  const index = headerIndex.get(header);
  if (index === undefined) {
    throw new Error(`Missing expected column ${header}`);
  }
  return row[index] ?? "";
}

function toRequiredInt(value: string) {
  if (!value) {
    throw new Error("Expected integer, got empty value");
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected integer, got ${value}`);
  }
  return parsed;
}

function toString(value: string) {
  return value ?? "";
}

function toNullableString(value: string) {
  return value === "" ? null : value;
}

function toNullableNumeric(value: string) {
  return value === "" ? null : value;
}

async function loadCsv(fileName: string, dataDir: string) {
  const filePath = path.join(dataDir, fileName);
  const text = await readFile(filePath, "utf8");
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error(`No rows found in ${filePath}`);
  }
  const [headerRow, ...dataRows] = rows;
  const headerIndex = buildHeaderIndex(headerRow);
  return { headerIndex, dataRows };
}

async function insertInChunks<T>(
  rows: T[],
  label: string,
  insert: (chunk: T[]) => Promise<void>
) {
  const total = rows.length;
  const totalChunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    console.log(
      `[${label}] chunk ${chunkIndex}/${totalChunks} (${i + chunk.length}/${total})`
    );
    await insert(chunk);
  }
}

async function seedRefSpecialisme(dataDir: string) {
  const { headerIndex, dataRows } = await loadCsv("06_REF_SPC.csv", dataDir);
  const rows = dataRows.map((row) => ({
    specialismeCd: toString(readCell(row, headerIndex, "SPECIALISME_CD")),
    omschrijving: toString(readCell(row, headerIndex, "OMSCHRIJVING")),
    versie: toString(readCell(row, headerIndex, "VERSIE")),
    datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
    peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
  }));

  await insertInChunks(rows, "ref_specialisme", async (chunk) => {
    await db.insert(refSpecialisme).values(chunk);
  });
  return rows.length;
}

async function seedRefZorgprofielklasseAndZorgactiviteit(dataDir: string) {
  const { headerIndex, dataRows } = await loadCsv("03_REF_ZAT.csv", dataDir);
  const zorgprofielklasseMap = new Map<string, typeof refZorgprofielklasse.$inferInsert>();
  const zorgactiviteitRows = dataRows.map((row) => {
    const zorgprofielklasseCd = toString(
      readCell(row, headerIndex, "ZORGPROFIELKLASSE_CD")
    );
    const zorgprofielklasseOms = toString(
      readCell(row, headerIndex, "ZORGPROFIELKLASSE_OMS")
    );

    if (!zorgprofielklasseMap.has(zorgprofielklasseCd)) {
      zorgprofielklasseMap.set(zorgprofielklasseCd, {
        zorgprofielklasseCd,
        zorgprofielklasseOms: zorgprofielklasseOms,
        versie: toString(readCell(row, headerIndex, "VERSIE")),
        datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
        peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
      });
    }

    return {
      zorgactiviteitCd: toString(
        readCell(row, headerIndex, "ZORGACTIVITEIT_CD")
      ),
      omschrijving: toString(readCell(row, headerIndex, "OMSCHRIJVING")),
      zorgprofielklasseCd,
      versie: toString(readCell(row, headerIndex, "VERSIE")),
      datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
      peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
    };
  });

  const zorgprofielklasseRows = Array.from(zorgprofielklasseMap.values());

  await insertInChunks(
    zorgprofielklasseRows,
    "ref_zorgprofielklasse",
    async (chunk) => {
    await db.insert(refZorgprofielklasse).values(chunk);
    }
  );

  await insertInChunks(
    zorgactiviteitRows,
    "ref_zorgactiviteit",
    async (chunk) => {
    await db.insert(refZorgactiviteit).values(chunk);
    }
  );

  return {
    zorgprofielklasseCount: zorgprofielklasseRows.length,
    zorgactiviteitCount: zorgactiviteitRows.length,
  };
}

async function seedRefDiagnose(dataDir: string) {
  const { headerIndex, dataRows } = await loadCsv("04_REF_DGN.csv", dataDir);
  const rows = dataRows.map((row) => ({
    diagnoseCd: toString(readCell(row, headerIndex, "DIAGNOSE_CD")),
    specialismeCd: toString(readCell(row, headerIndex, "SPECIALISME_CD")),
    diagnoseOmschrijving: toString(
      readCell(row, headerIndex, "DIAGNOSE_OMSCHRIJVING")
    ),
    versie: toString(readCell(row, headerIndex, "VERSIE")),
    datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
    peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
  }));

  await insertInChunks(rows, "ref_diagnose", async (chunk) => {
    await db.insert(refDiagnose).values(chunk);
  });
  return rows.length;
}

async function seedRefZorgproduct(dataDir: string) {
  const { headerIndex, dataRows } = await loadCsv("05_REF_ZPD.csv", dataDir);
  const rows = dataRows.map((row) => ({
    zorgproductCd: toString(readCell(row, headerIndex, "ZORGPRODUCT_CD")),
    latijnOms: toString(readCell(row, headerIndex, "LATIJN_OMS")),
    consumentOms: toString(readCell(row, headerIndex, "CONSUMENT_OMS")),
    declaratieVerzekerdCd: toString(
      readCell(row, headerIndex, "DECLARATIE_VERZEKERD_CD")
    ),
    declaratieOnverzekerdCd: toNullableString(
      readCell(row, headerIndex, "DECLARATIE_ONVERZEKERD_CD")
    ),
    versie: toString(readCell(row, headerIndex, "VERSIE")),
    datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
    peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
  }));

  await insertInChunks(rows, "ref_zorgproduct", async (chunk) => {
    await db.insert(refZorgproduct).values(chunk);
  });
  return rows.length;
}

async function seedFactDbc(dataDir: string) {
  const { headerIndex, dataRows } = await loadCsv("01_DBC.csv", dataDir);
  const rows = dataRows.map((row) => ({
    jaar: toRequiredInt(readCell(row, headerIndex, "JAAR")),
    behandelendSpecialismeCd: toString(
      readCell(row, headerIndex, "BEHANDELEND_SPECIALISME_CD")
    ),
    typerendeDiagnoseCd: toString(
      readCell(row, headerIndex, "TYPERENDE_DIAGNOSE_CD")
    ),
    zorgproductCd: toString(readCell(row, headerIndex, "ZORGPRODUCT_CD")),
    aantalPatPerZpd: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_PAT_PER_ZPD")
    ),
    aantalSubtrajectPerZpd: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_SUBTRAJECT_PER_ZPD")
    ),
    aantalPatPerDiag: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_PAT_PER_DIAG")
    ),
    aantalSubtrajectPerDiag: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_SUBTRAJECT_PER_DIAG")
    ),
    aantalPatPerSpc: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_PAT_PER_SPC")
    ),
    aantalSubtrajectPerSpc: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_SUBTRAJECT_PER_SPC")
    ),
    gemiddeldeVerkoopprijs: toNullableNumeric(
      readCell(row, headerIndex, "GEMIDDELDE_VERKOOPPRIJS")
    ),
    versie: toString(readCell(row, headerIndex, "VERSIE")),
    datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
    peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
  }));

  await insertInChunks(rows, "fact_dbc", async (chunk) => {
    await db.insert(factDbc).values(chunk);
  });
  return rows.length;
}

async function seedFactDbcProfiel(dataDir: string) {
  const { headerIndex, dataRows } = await loadCsv("02_DBC_PROFIEL.csv", dataDir);
  const rows = dataRows.map((row) => ({
    jaar: toRequiredInt(readCell(row, headerIndex, "JAAR")),
    behandelendSpecialismeCd: toString(
      readCell(row, headerIndex, "BEHANDELEND_SPECIALISME_CD")
    ),
    typerendeDiagnoseCd: toString(
      readCell(row, headerIndex, "TYPERENDE_DIAGNOSE_CD")
    ),
    zorgproductCd: toString(readCell(row, headerIndex, "ZORGPRODUCT_CD")),
    zorgactiviteitCd: toString(
      readCell(row, headerIndex, "ZORGACTIVITEIT_CD")
    ),
    zorgprofielklasseCd: toString(
      readCell(row, headerIndex, "ZORGPROFIELKLASSE_CD")
    ),
    aantalPat: toRequiredInt(readCell(row, headerIndex, "AANTAL_PAT")),
    aantalSubtraject: toRequiredInt(
      readCell(row, headerIndex, "AANTAL_SUBTRAJECT")
    ),
    aantalZat: toRequiredInt(readCell(row, headerIndex, "AANTAL_ZAT")),
    somAantalZat: toRequiredInt(readCell(row, headerIndex, "SOM_AANTAL_ZAT")),
    versie: toString(readCell(row, headerIndex, "VERSIE")),
    datumBestand: toString(readCell(row, headerIndex, "DATUM_BESTAND")),
    peildatum: toString(readCell(row, headerIndex, "PEILDATUM")),
  }));

  await insertInChunks(rows, "fact_dbc_profiel", async (chunk) => {
    await db.insert(factDbcProfiel).values(chunk);
  });
  return rows.length;
}

async function clearTables() {
  await db.delete(factDbcProfiel);
  await db.delete(factDbc);
  await db.delete(refDiagnose);
  await db.delete(refZorgproduct);
  await db.delete(refZorgactiviteit);
  await db.delete(refZorgprofielklasse);
  await db.delete(refSpecialisme);
}

async function main() {
  const dataDir = process.env.SEED_DATA_DIR ?? DEFAULT_DATA_DIR;

  console.log(`Seeding from ${dataDir}`);
  await clearTables();

  const specialismeCount = await seedRefSpecialisme(dataDir);
  const { zorgprofielklasseCount, zorgactiviteitCount } =
    await seedRefZorgprofielklasseAndZorgactiviteit(dataDir);
  const diagnoseCount = await seedRefDiagnose(dataDir);
  const zorgproductCount = await seedRefZorgproduct(dataDir);
  const factDbcCount = await seedFactDbc(dataDir);
  const factDbcProfielCount = await seedFactDbcProfiel(dataDir);

  console.log("Seed complete", {
    specialismeCount,
    zorgprofielklasseCount,
    zorgactiviteitCount,
    diagnoseCount,
    zorgproductCount,
    factDbcCount,
    factDbcProfielCount,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
