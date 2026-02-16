import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { from as copyFrom } from "pg-copy-streams";

import { pool } from "../api/db.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DATA_DIR = path.join(rootDir, "data");

type SeedEntry = {
  table: string;
  fileName: string;
};

const SEED_ENTRIES: SeedEntry[] = [
  { table: "ref_specialisme", fileName: "ref_specialisme.csv" },
  { table: "ref_zorgprofielklasse", fileName: "ref_zorgprofielklasse.csv" },
  { table: "ref_zorgactiviteit", fileName: "ref_zorgactiviteit.csv" },
  { table: "ref_zorgproduct", fileName: "ref_zorgproduct.csv" },
  { table: "ref_diagnose", fileName: "ref_diagnose.csv" },
  { table: "fact_dbc", fileName: "fact_dbc.csv" },
  { table: "fact_dbc_profiel", fileName: "fact_dbc_profiel.csv" },
];

const copyCsv = async (table: string, filePath: string) => {
  const client = await pool.connect();
  try {
    const copyStream = client.query(
      copyFrom(`COPY ${table} FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')`)
    );
    await new Promise<void>((resolve, reject) => {
      const fileStream = createReadStream(filePath);
      fileStream.on("error", reject);
      copyStream.on("error", reject);
      copyStream.on("finish", resolve);
      fileStream.pipe(copyStream);
    });
  } finally {
    client.release();
  }
};

const truncateTables = async (tables: string[]) => {
  await pool.query(`TRUNCATE ${tables.join(", ")};`);
};

const main = async () => {
  const dataDir = process.env.SEED_DATA_DIR ?? DEFAULT_DATA_DIR;
  console.log(`Seeding from ${dataDir}`);

  await truncateTables(SEED_ENTRIES.map((entry) => entry.table).reverse());

  for (const entry of SEED_ENTRIES) {
    const filePath = path.join(dataDir, entry.fileName);
    console.log(`COPY ${entry.table} <- ${entry.fileName}`);
    await copyCsv(entry.table, filePath);
  }

  console.log("Seed complete", {
    tables: SEED_ENTRIES.map((entry) => entry.table),
  });
};

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
